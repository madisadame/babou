// Configuration Metro explicite pour un projet dans un monorepo (npm workspaces).
// Sans ce fichier, Metro peut mal détecter la racine du projet et tenter de
// parcourir tout le disque au lieu de se limiter à Babou.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
