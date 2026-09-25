import { AlumniRecord } from './alumni.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(AlumniRecord, {
  label: 'Alumni record',
  searchFields: ['firstName', 'lastName', 'maidenName', 'email', 'studentNumber'],
  filterFields: ['alumniIdStatus', 'course', 'yearGraduated'],
  sortFields: ['lastName', 'course', 'yearGraduated', 'createdAt'],
});

export const alumniService = {
  ...crud,

  async create({ requestAlumniId, consent, birthDate, ...data }) {
    const record = await AlumniRecord.create({
      ...data,
      birthDate: birthDate || null,
      alumniIdStatus: requestAlumniId ? 'requested' : 'not_requested',
      consentAt: new Date(),
    });
    return { id: record.id, alumniIdStatus: record.alumniIdStatus };
  },
};
