import { Router } from 'express';
import authRoutes from '../../modules/auth/auth.routes.js';
import userRoutes from '../../modules/users/user.routes.js';
import dashboardRoutes from '../../modules/dashboard/dashboard.routes.js';
import contentRoutes from '../../modules/content/content.routes.js';
import campaignRoutes from '../../modules/campaigns/campaign.routes.js';
import donationRoutes from '../../modules/donations/donation.routes.js';
import scholarRoutes from '../../modules/scholars/scholar.routes.js';
import networkRoutes from '../../modules/networks/network.routes.js';
import partnerRoutes from '../../modules/partners/partner.routes.js';
import projectRoutes from '../../modules/projects/project.routes.js';
import reportRoutes from '../../modules/reports/report.routes.js';
import alumniRoutes from '../../modules/alumni/alumni.routes.js';
import tracerRoutes from '../../modules/tracer/tracer.routes.js';
import volunteerRoutes from '../../modules/volunteers/volunteer.routes.js';
import messageRoutes from '../../modules/messages/message.routes.js';
import logRoutes from '../../modules/logs/log.routes.js';

const router = Router();

router.get('/', (req, res) => res.json({ success: true, message: 'MCU Alumni API v1', data: { version: 'v1' } }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/content', contentRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/donations', donationRoutes);
router.use('/scholars', scholarRoutes);
router.use('/networks', networkRoutes);
router.use('/partners', partnerRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/alumni', alumniRoutes);
router.use('/tracer', tracerRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/messages', messageRoutes);
router.use('/logs', logRoutes);

export default router;
