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

router.post('/nodes', async (req, res, next) => {
  try {
    const { label, properties } = req.body;
    const result = await graphService.createNode(label, properties);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/relationships', async (req, res, next) => {
  try {
    const { sourceName, targetName, relationshipType } = req.body;
    const result = await graphService.createRelationship(sourceName, targetName, relationshipType);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    const result = await graphService.resetDatabase();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    const result = await graphService.runCustomQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
