const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 28206;
const mongoUri = process.env.mongoDB_URI;

let mongoClient;
let projectsCollection;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function connectToMongo() {
  if (!mongoUri) {
    console.warn('mongoDB_URI is not set. Project saving is disabled until the env var is configured.');
    return;
  }

  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db();
  projectsCollection = db.collection('container_home_projects');
  await projectsCollection.createIndex({ updatedAt: -1 });
  console.log('Connected to MongoDB.');
}

function sanitizeProject(project) {
  return {
    name: String(project.name || 'Untitled container home').slice(0, 80),
    houseComparison: {
      purchasePrice: Number(project.houseComparison?.purchasePrice) || 0,
      downPaymentPercent: Number(project.houseComparison?.downPaymentPercent) || 0,
      closingCostPercent: Number(project.houseComparison?.closingCostPercent) || 0,
      repairReserve: Number(project.houseComparison?.repairReserve) || 0
    },
    site: {
      landCost: Number(project.site?.landCost) || 0,
      sitePrep: Number(project.site?.sitePrep) || 0,
      foundation: Number(project.site?.foundation) || 0,
      permitEngineering: Number(project.site?.permitEngineering) || 0,
      contingencyPercent: Number(project.site?.contingencyPercent) || 0
    },
    systems: {
      electrical: Number(project.systems?.electrical) || 0,
      plumbing: Number(project.systems?.plumbing) || 0,
      hvac: Number(project.systems?.hvac) || 0,
      insulation: Number(project.systems?.insulation) || 0,
      waterSewer: Number(project.systems?.waterSewer) || 0,
      solarBattery: Number(project.systems?.solarBattery) || 0
    },
    containers: Array.isArray(project.containers) ? project.containers.slice(0, 24).map((container, index) => ({
      id: String(container.id || `container-${index + 1}`).slice(0, 40),
      label: String(container.label || `C${index + 1}`).slice(0, 20),
      size: container.size === '20' ? '20' : '40',
      condition: ['used', 'cargo-worthy', 'one-trip'].includes(container.condition) ? container.condition : 'used',
      level: Number(container.level) || 1,
      rotation: Number(container.rotation) === 90 ? 90 : 0,
      x: Number(container.x) || 0,
      y: Number(container.y) || 0,
      modifications: {
        cutOpenings: Boolean(container.modifications?.cutOpenings),
        reinforce: Boolean(container.modifications?.reinforce),
        joinery: Boolean(container.modifications?.joinery)
      }
    })) : []
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'myhouse',
    mongo: Boolean(projectsCollection),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/projects', async (req, res, next) => {
  try {
    if (!projectsCollection) {
      return res.json([]);
    }

    const projects = await projectsCollection
      .find({}, { projection: { project: 0 } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    res.json(projects.map((project) => ({
      id: project._id.toString(),
      name: project.name,
      totalCost: project.totalCost,
      containerCount: project.containerCount,
      updatedAt: project.updatedAt
    })));
  } catch (error) {
    next(error);
  }
});

app.get('/api/projects/:id', async (req, res, next) => {
  try {
    if (!projectsCollection || !ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const saved = await projectsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!saved) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ id: saved._id.toString(), ...saved.project });
  } catch (error) {
    next(error);
  }
});

app.post('/api/projects', async (req, res, next) => {
  try {
    if (!projectsCollection) {
      return res.status(503).json({ error: 'Project saving is unavailable because mongoDB_URI is not configured.' });
    }

    const project = sanitizeProject(req.body);
    const now = new Date();
    const totalCost = Number(req.body.totalCost) || 0;

    const result = await projectsCollection.insertOne({
      name: project.name,
      project,
      totalCost,
      containerCount: project.containers.length,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({ id: result.insertedId.toString(), saved: true });
  } catch (error) {
    next(error);
  }
});

app.put('/api/projects/:id', async (req, res, next) => {
  try {
    if (!projectsCollection || !ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = sanitizeProject(req.body);
    const totalCost = Number(req.body.totalCost) || 0;
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name: project.name,
          project,
          totalCost,
          containerCount: project.containers.length,
          updatedAt: new Date()
        }
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ id: req.params.id, saved: true });
  } catch (error) {
    next(error);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong.' });
});

connectToMongo()
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  })
  .finally(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`My House listening on 0.0.0.0:${PORT}`);
    });
  });
