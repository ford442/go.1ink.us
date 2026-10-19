import projectData from '../../data/projectData';
import { projectsToTracks } from '../../lib/orbitalOps';

// The catalog is static, so its propagators are built once when this lazy
// chunk first loads and shared by the panel and the constellation overlay.
export const ORBITAL_TRACKS = projectsToTracks(projectData);

export const PROJECT_BY_ID = new Map(projectData.map((project) => [project.id, project]));
