const express = require('express');
const app = express();
app.use(express.json());
const { MongoClient } = require("mongodb");
const cors = require('cors');
app.use(cors());

// MongoDB connection URL
const url = 'mongodb+srv://michaelding123:Dbm2tmXf3ziNDas6@cluster1.ftqqxnu.mongodb.net/';

// MongoDB database name
const dbName = 'sample_mflix';

// MongoDB collection name
const collectionName = 'players';

// Connect to MongoDB
const client = new MongoClient(url);
client.connect();
const db = client.db(dbName);
const collection = db.collection(collectionName);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

const path = require('path');

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to fetch players data
app.get('/players', async (req, res) => {
  console.log('Fetching players data');
    try {
        const players = await collection.find({}).toArray();
        res.json(players);
    } catch (err) {
        console.error('Error fetching players data:', err);
        res.status(500).send('Error fetching players data');
    }
});

// API endpoint to fetch player stats by name
app.get('/players/:name', async (req, res) => {
  const playerName = req.params.name;
  console.log(`Fetching stats for player ${playerName}`);
  try {
      const player = await collection.findOne({ name: playerName });
      if (player) {
          res.json(player);
      } else {
          res.status(404).send(`Player "${playerName}" not found`);
      }
  } catch (err) {
      console.error(`Error fetching stats for player ${playerName}:`, err);
      res.status(500).send(`Error fetching stats for player ${playerName}`);
  }
});

// API endpoint to add a new player
app.post('/players', async (req, res) => {
  const newPlayer = req.body;
  // Convert the ID to a number
  newPlayer.id = parseInt(newPlayer.id);
  console.log(`Adding new player: ${newPlayer.name}`);
  try {
    const result = await collection.insertOne(newPlayer);
    if (result.acknowledged) {
      res.sendStatus(200);
    } else {
      res.status(500).send('Error adding player');
    }
  } catch (err) {
    console.error(`Error adding player ${newPlayer.name}:`, err);
    res.status(500).send(`Error adding player ${newPlayer.name}`);
  }
});

// API endpoint to update a player
app.put('/players/:id', async (req, res) => {
  const playerId = parseInt(req.params.id);
  const updatedPlayerData = req.body;
  console.log(`Updating player with ID ${playerId}`);

  try {
    const result = await collection.updateOne(
      { id: playerId },
      { $set: updatedPlayerData }
    );

    if (result.modifiedCount === 1) {
      res.sendStatus(200);
    } else {
      res.status(404).send(`Player with ID ${playerId} not found`);
    }
  } catch (err) {
    console.error(`Error updating player with ID ${playerId}:`, err);
    res.status(500).send(`Error updating player with ID ${playerId}`);
  }
});

// API endpoint to delete a player
app.delete('/players/:id', async (req, res) => {
  const playerId = parseInt(req.params.id);
  console.log(`Deleting player with ID ${playerId}`);

  try {
    const result = await collection.deleteOne({ id: playerId });

    if (result.deletedCount === 1) {
      res.sendStatus(200);
    } else {
      res.status(404).send(`Player with ID ${playerId} not found`);
    }
  } catch (err) {
    console.error(`Error deleting player with ID ${playerId}:`, err);
    res.status(500).send(`Error deleting player with ID ${playerId}`);
  }
});

// API endpoint to fetch player stats by age
app.get('/players/age/:age', async (req, res) => {
  const age = parseInt(req.params.age);
  console.log(`Fetching stats for players with age ${age}`);

  try {
    const players = await collection.find({ age: age }).toArray();

    if (players.length > 0) {
      // Calculate averages
      const totalPoints = players.reduce((sum, player) => sum + player.points_per_game, 0);
      const totalRebounds = players.reduce((sum, player) => sum + player.rebounds_per_game, 0);
      const totalAssists = players.reduce((sum, player) => sum + player.assists_per_game, 0);
      const totalSteals = players.reduce((sum, player) => sum + player.steals_per_game, 0);
      const totalBlocks = players.reduce((sum, player) => sum + player.blocks_per_game, 0);
      const totalFreeThrowPercentage = players.reduce((sum, player) => sum + player.free_throw_percentage, 0);

      const averageStats = {
        points_per_game: totalPoints / players.length,
        rebounds_per_game: totalRebounds / players.length,
        assists_per_game: totalAssists / players.length,
        steals_per_game: totalSteals / players.length,
        blocks_per_game: totalBlocks / players.length,
        free_throw_percentage: totalFreeThrowPercentage / players.length
      };

      res.json({ players, averageStats });
    } else {
      res.status(404).send(`No players found with age ${age}`);
    }
  } catch (err) {
    console.error(`Error fetching stats for players with age ${age}:`, err);
    res.status(500).send(`Error fetching stats for players with age ${age}`);
  }
});