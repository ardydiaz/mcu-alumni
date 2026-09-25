import { fn, col } from 'sequelize';
import { Donation } from '../donations/donation.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { AlumniRecord } from '../alumni/alumni.model.js';
import { TracerResponse } from '../tracer/tracer.model.js';
import { Volunteer } from '../volunteers/volunteer.model.js';
import { Message } from '../messages/message.model.js';
import { User } from '../users/user.model.js';
import { Scholar } from '../scholars/scholar.model.js';
import { Partner } from '../partners/partner.model.js';

// Sums donation amounts per status and currency: { pledged: { PHP: 1000 }, confirmed: {...} }
async function donationTotals() {
  const rows = await Donation.findAll({
    attributes: ['status', 'currency', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
    group: ['status', 'currency'],
    raw: true,
  });
  const totals = {};
  for (const r of rows) {
    totals[r.status] ??= { count: 0, amount: {} };
    totals[r.status].count += Number(r.count);
    totals[r.status].amount[r.currency] = Number(r.total);
  }
  return totals;
}

async function donationsByCampaign() {
  const rows = await Donation.findAll({
    where: { status: 'confirmed' },
    attributes: ['campaignId', 'currency', [fn('SUM', col('amount')), 'total']],
    include: [{ model: Campaign, as: 'campaign', attributes: ['title'] }],
    group: ['campaignId', 'currency', 'campaign.id'],
    raw: true,
    nest: true,
  });
  return rows.map((r) => ({ campaignId: r.campaignId, campaign: r.campaign.title, currency: r.currency, total: Number(r.total) }));
}

export const dashboardService = {
  async getStats() {
    const [
      alumniTotal,
      alumniIdRequests,
      tracerTotal,
      volunteersNew,
      volunteersTotal,
      messagesUnread,
      pendingAccessRequests,
      scholarsActive,
      merchantPartners,
      industryPartners,
      donations,
      byCampaign,
    ] = await Promise.all([
      AlumniRecord.count(),
      AlumniRecord.count({ where: { alumniIdStatus: ['requested', 'processing'] } }),
      TracerResponse.count(),
      Volunteer.count({ where: { status: 'new' } }),
      Volunteer.count(),
      Message.count({ where: { isRead: false } }),
      User.unscoped().count({ where: { status: 'pending' } }),
      Scholar.count({ where: { isActive: true } }),
      Partner.count({ where: { type: 'merchant', isActive: true } }),
      Partner.count({ where: { type: 'industry', isActive: true } }),
      donationTotals(),
      donationsByCampaign(),
    ]);

    return {
      alumni: { total: alumniTotal, pendingAlumniIds: alumniIdRequests },
      tracer: { total: tracerTotal },
      volunteers: { total: volunteersTotal, new: volunteersNew },
      messages: { unread: messagesUnread },
      users: { pendingAccessRequests },
      scholars: { active: scholarsActive },
      partners: { merchant: merchantPartners, industry: industryPartners },
      donations: { byStatus: donations, confirmedByCampaign: byCampaign },
    };
  },

  async getRecentActivity(limit = 5) {
    const [donations, alumni, messages, volunteers] = await Promise.all([
      Donation.findAll({
        limit,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'amount', 'currency', 'status', 'createdAt'],
        include: [{ model: Campaign, as: 'campaign', attributes: ['title'] }],
      }),
      AlumniRecord.findAll({ limit, order: [['createdAt', 'DESC']], attributes: ['id', 'firstName', 'lastName', 'course', 'yearGraduated', 'alumniIdStatus', 'createdAt'] }),
      Message.findAll({ limit, order: [['createdAt', 'DESC']], attributes: ['id', 'name', 'subject', 'isRead', 'createdAt'] }),
      Volunteer.findAll({ limit, order: [['createdAt', 'DESC']], attributes: ['id', 'firstName', 'lastName', 'role', 'status', 'createdAt'] }),
    ]);
    return { donations, alumni, messages, volunteers };
  },
};
