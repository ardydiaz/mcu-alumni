import { projectService } from './project.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const projectController = createCrudController(projectService, { label: 'Project' });
