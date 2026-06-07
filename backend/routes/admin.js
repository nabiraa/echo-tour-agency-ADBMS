const express = require('express');
const router = express.Router();

const Tour = require('../models/Tour');
const Ticket = require('../models/Ticket');
const Artist = require('../models/Artist');
const Venue = require('../models/Venue');   

// ─────────────────────────────────────────────
// MIDDLEWARE — Role-Based Access Control Gatekeeper
//
// Reads the custom 'x-user-role' header sent by the frontend.
// If the value is not exactly 'manager', the request is
// terminated here with a 403 Forbidden before any DB work runs.
// This middleware is applied to every route in this file via
// router.use(), so no individual route needs to repeat this check.
// ─────────────────────────────────────────────
const requireManager = (req, res, next) => {
  const role = req.headers['x-user-role'];

  if (!role) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No role header provided. Please log in.'
    });
  }

  if (role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: `Forbidden: This endpoint requires manager privileges. Received role: '${role}'.`
    });
  }

  // Role confirmed — pass control to the actual route handler
  next();
};

// Apply the gatekeeper to ALL routes defined in this file
router.use(requireManager);

// ─────────────────────────────────────────────
// GET /api/admin/analytics
//
// 4-Stage Aggregation Pipeline:
//
// Stage 1 — $unwind
//   Deconstructs the embedded 'concerts' array so each concert
//   becomes its own pipeline document. A tour with 3 concerts
//   produces 3 separate documents at this stage.
//
// Stage 2 — $lookup
//   Performs a LEFT JOIN from each unwound concert document
//   to the 'tickets' collection, matching on concertId.
//   Each document now carries a 'soldTickets' array of all
//   ticket receipts issued for that specific concert.
//
// Stage 3 — $group
//   Re-groups by the parent Tour's _id, rolling up:
//     - tourTitle        (first value, same across all concerts in group)
//     - totalRevenue     ($sum of totalPaid across all matched tickets)
//     - totalTicketsSold ($sum of ticket count per concert)
//     - concertCount     (how many concerts are in this tour)
//
// Stage 4 — $sort
//   Orders the final output by totalRevenue descending so the
//   highest-grossing tour appears first in the dashboard table.
// ─────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await Tour.aggregate([

      // ── STAGE 1: $unwind ──────────────────
      // Break the embedded concerts array apart.
      // preserveNullAndEmptyArrays keeps tours with zero
      // concerts in the results rather than silently dropping them.
      {
        $unwind: {
          path: '$concerts',
          preserveNullAndEmptyArrays: true
        }
      },

      // ── STAGE 2: $lookup ──────────────────
      // Join to the tickets collection.
      // We match tickets where ticket.concertId === concert.concertId
      // The result is a 'soldTickets' array on each document.
      {
        $lookup: {
          from: 'tickets',
          localField: 'concerts.concertId',
          foreignField: 'concertId',
          as: 'soldTickets'
        }
      },

      // ── STAGE 3: $group ───────────────────
      // Collapse back to one document per tour,
      // computing revenue and attendance as we go.
      {
        $group: {
          _id: '$_id',
          tourTitle: { $first: '$title' },
          artistId: { $first: '$artist' },
          tourStatus: { $first: '$status' },
          tourYear: { $first: '$year' },
          concertCount: { $sum: 1 },

          // $sum across all ticket documents in the soldTickets arrays
          // for every concert that belongs to this tour
          totalRevenue: {
            $sum: {
              $reduce: {
                input: '$soldTickets',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.totalPaid'] }
              }
            }
          },

          // Total confirmed ticket count across all concerts
          totalTicketsSold: {
            $sum: { $size: '$soldTickets' }
          },

          // Track remaining capacity across all concerts in the tour
          totalRemainingTickets: {
            $sum: {
              $ifNull: ['$concerts.availableTickets', 0]
            }
          }
        }
      },

      // ── STAGE 4: $sort ────────────────────
      // Highest revenue tours float to the top of the dashboard
      {
        $sort: { totalRevenue: -1 }
      }

    ]);

    // Populate artist details separately since aggregation pipelines
    // bypass Mongoose's .populate() — we use Model.populate() instead
    const populated = await Tour.populate(analytics, {
      path: 'artistId',
      select: 'name type agency',
      model: 'Artist'
    });

    res.status(200).json({
      success: true,
      count: populated.length,
      data: populated
    });

  } catch (error) {
    console.error('GET /api/admin/analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while computing analytics.'
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/tickets
//
// Returns all ticket receipts with full user and tour info.
// Used in the Manager's Control Panel table on the frontend.
// Also gated by requireManager (inherited from router.use above).
// ─────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'username email role')
      .populate('tour', 'title year status')
      .sort({ purchaseDate: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('GET /api/admin/tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ticket records.'
    });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/tickets/:ticketId
//
// Allows a manager to cancel/refund a ticket by ID.
// Updates status to 'Refunded' and restores the
// availableTickets counter on the parent concert.
// ─────────────────────────────────────────────
router.delete('/tickets/:ticketId', async (req, res) => {
  const session = await require('mongoose').startSession();

  try {
    let refundedTicket;

    await session.withTransaction(async () => {
      const mongoose = require('mongoose');

      const ticket = await Ticket.findById(req.params.ticketId).session(session);

      if (!ticket) {
        throw new Error('TICKET_NOT_FOUND');
      }

      if (ticket.status === 'Refunded') {
        throw new Error('ALREADY_REFUNDED');
      }

      // Restore the ticket slot on the parent concert
      const Tour = require('../models/Tour');
      const tour = await Tour.findById(ticket.tour).session(session);

      if (tour) {
        const concert = tour.concerts.id(ticket.concertId);
        if (concert) {
          concert.availableTickets += 1;
          // If it was Sold Out, open it back up
          if (concert.status === 'Sold Out') {
            concert.status = 'Scheduled';
          }
          await tour.save({ session });
        }
      }

      ticket.status = 'Refunded';
      await ticket.save({ session });
      refundedTicket = ticket;
    });

    res.status(200).json({
      success: true,
      message: 'Ticket refunded and seat restored successfully.',
      data: refundedTicket
    });

  } catch (error) {
    console.error('DELETE /api/admin/tickets/:ticketId error:', error.message);

    const errorMap = {
      TICKET_NOT_FOUND:  { status: 404, message: 'Ticket not found.' },
      ALREADY_REFUNDED:  { status: 409, message: 'This ticket has already been refunded.' }
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    res.status(500).json({
      success: false,
      message: 'Server error processing refund.'
    });

  } finally {
    session.endSession();
  }
});

module.exports = router;