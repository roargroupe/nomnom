module.exports = function (app) {
  // set up the routes themselves
  app.get("/", function (req, res) {
    res.send('NOMNOMNOM');
  });

};