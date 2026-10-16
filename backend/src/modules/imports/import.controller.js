import { importService } from './import.service.js';
import { staffActor } from '../profiles/profile.service.js';
import { logService } from '../logs/log.service.js';
import { ApiError, asyncHandler } from '../../utils/helpers.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

const requireFile = (req) => {
  if (!req.file) throw ApiError.unprocessable('Choose a CSV file to upload.', { file: 'Choose a CSV file' });
  return req.file;
};

export const importController = {
  preview: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await importService.preview(requireFile(req), req.body.mode) });
  }),

  commit: asyncHandler(async (req, res) => {
    const batch = await importService.commit(requireFile(req), req.body.mode, staffActor(req.user));
    await logService.record(req, {
      action: 'create',
      entity: 'Alumni import',
      entityId: batch.id,
      description: `Imported ${batch.fileName}: ${batch.createdCount} new, ${batch.updatedCount} updated, ${batch.skippedCount} skipped`,
    });
    sendCreated(res, batch, `${batch.createdCount} new alumni records imported${batch.updatedCount ? `, ${batch.updatedCount} updated` : ''}`);
  }),

  list: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await importService.list() });
  }),

  get: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await importService.get(req.params.id) });
  }),

  undo: asyncHandler(async (req, res) => {
    const result = await importService.undo(req.params.id, staffActor(req.user));
    const batch = await importService.get(req.params.id);
    await logService.record(req, { action: 'delete', entity: 'Alumni import', entityId: batch.id, description: `Undid import of ${batch.fileName}: ${result.removed} records removed, ${result.kept} kept` });
    const kept = result.kept ? ` ${result.kept} kept because the alumnus already claimed or someone edited them.` : '';
    sendSuccess(res, { data: result, message: `Import undone: ${result.removed} records removed.${kept}` });
  }),

  export: asyncHandler(async (req, res) => {
    const csv = await importService.exportCsv(req.query);
    const stamp = new Date().toISOString().slice(0, 10);
    await logService.record(req, { action: 'export', entity: 'Alumni profile', description: `Exported ${csv.split('\r\n').length - 2} alumni profiles to CSV` });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mcu-alumni-profiles-${stamp}.csv"`);
    res.send(csv);
  }),
};
