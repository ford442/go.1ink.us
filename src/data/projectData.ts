import type { Project } from '../types';
import { validateProjects } from '../lib/validateProjects';
import projectsJson from './projects.json';

const projectData = projectsJson as Project[];

validateProjects(projectData);

export default projectData;
