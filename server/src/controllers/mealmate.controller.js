import { Subscriber } from '../models/Subscriber.js';
import { Donation } from '../models/Donation.js';

export const getFundingSummary = async (req, res, next) => {
  try {
    const [subscribers, donations] = await Promise.all([Subscriber.find({}), Donation.find({})]);

    const summary = subscribers.reduce((acc, sub) => {
      if (sub.status === 'Active') acc.activeSubscribers++;
      if (sub.status === 'At-Risk') acc.atRiskSubscribers++;
      if (sub.status !== 'Churned') {
        if (sub.currency === 'NGN') acc.monthlySubRevenueNgn += sub.amount;
        else if (sub.currency === 'USD') acc.monthlySubRevenueUsd += sub.amount;
      }
      return acc;
    }, { activeSubscribers: 0, atRiskSubscribers: 0, monthlySubRevenueNgn: 0, monthlySubRevenueUsd: 0 });

    const donationTotals = donations.reduce((acc, don) => {
      if (don.currency === 'NGN') acc.totalDonationsNgn += don.amount;
      else if (don.currency === 'USD') acc.totalDonationsUsd += don.amount;
      return acc;
    }, { totalDonationsNgn: 0, totalDonationsUsd: 0 });

    res.json({ success: true, data: { totalSubscribers: subscribers.length, ...summary, ...donationTotals } });
  } catch (err) { next(err); }
};

export const listSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: subscribers });
  } catch (err) { next(err); }
};
