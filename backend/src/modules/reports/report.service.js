import { Report } from './report.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(Report, {
  label: 'Report',
  searchFields: ['title', 'schoolYear'],
  filterFields: ['schoolYear', 'isPublished'],
  sortFields: ['schoolYear', 'title', 'periodStart', 'createdAt'],
  defaultOrder: [['schoolYear', 'DESC'], ['periodStart', 'ASC'], ['id', 'ASC']],
  publicWhere: { isPublished: true },
  fileFields: ['fileUrl'],
});

export const reportService = {
  ...crud,

  // Published reports grouped for the Transparency Reports page, newest school year first.
  async listGrouped() {
    const reports = await Report.findAll({
      where: { isPublished: true },
      order: [['schoolYear', 'DESC'], ['periodStart', 'ASC'], ['id', 'ASC']],
    });
    const groups = new Map();
    for (const report of reports) {
      if (!groups.has(report.schoolYear)) groups.set(report.schoolYear, []);
      groups.get(report.schoolYear).push(report);
    }
    return [...groups].map(([schoolYear, items]) => ({ schoolYear, reports: items }));
  },
};
