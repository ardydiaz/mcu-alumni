import { Donation } from './donation.model.js';
import { Campaign } from '../campaigns/campaign.model.js';
import { ApiError, createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(Donation, {
  label: 'Donation',
  searchFields: ['firstName', 'lastName', 'email', 'referenceNo'],
  filterFields: ['status', 'campaignId', 'currency'],
  sortFields: ['amount', 'status', 'createdAt', 'lastName'],
  include: [{ model: Campaign, as: 'campaign', attributes: ['id', 'slug', 'title'] }],
});

export const donationService = {
  ...crud,

  async create(data) {
    const campaign = await Campaign.findOne({ where: { id: data.campaignId, isActive: true } });
    if (!campaign) throw ApiError.unprocessable(undefined, { campaignId: 'Please choose a valid campaign' });
    const donation = await Donation.create(data);
    return { id: donation.id, status: donation.status, campaign: campaign.title };
  },

  async update(id, data) {
    const donation = await crud.getById(id, { internal: true });
    if (data.status === 'confirmed' && donation.status !== 'confirmed') data.confirmedAt = new Date();
    if (data.status && data.status !== 'confirmed') data.confirmedAt = null;
    return donation.update(data);
  },
};
