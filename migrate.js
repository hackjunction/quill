module.exports = {
  dbConnectionUri: process.env.MONGO_URL || process.env.DATABASE || "mongodb://localhost:27017",
  autosync: true
}
