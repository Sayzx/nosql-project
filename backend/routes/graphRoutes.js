const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');

router.get('/machines', async (req, res, next) => {
  try {
    const machines = await graphService.getMachines();
    res.json(machines);
  } catch (error) {
    next(error);
  }
});

router.get('/graph', async (req, res, next) => {
  try {
    const graphData = await graphService.getGraphData();
    res.json(graphData);
  } catch (error) {
    next(error);
  }
});

router.get('/attack-paths', async (req, res, next) => {
  try {
    const startNode = req.query.startNode || 'PC-ALICE';
    const paths = await graphService.getAttackPaths(startNode);
    res.json(paths);
  } catch (error) {
    next(error);
  }
});

router.get('/vulnerable-machines', async (req, res, next) => {
  try {
    const startNode = req.query.startNode || 'PC-ALICE';
    const vulns = await graphService.getVulnerableMachines(startNode);
    res.json(vulns);
  } catch (error) {
    next(error);
  }
});

router.get('/accessible-resources', async (req, res, next) => {
  try {
    const startNode = req.query.startNode || 'PC-ALICE';
    const resources = await graphService.getAccessibleResources(startNode);
    res.json(resources);
  } catch (error) {
    next(error);
  }
});

router.get('/admin-users', async (req, res, next) => {
  try {
    const admins = await graphService.getAdminUsers();
    res.json(admins);
  } catch (error) {
    next(error);
  }
});

router.get('/exposed-services', async (req, res, next) => {
  try {
    const services = await graphService.getExposedServices();
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await graphService.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await graphService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
