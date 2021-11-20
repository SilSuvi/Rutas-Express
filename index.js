const express = require("express");
const servidor = express();
const mongodb = require("mongodb");
let MongoClient = mongodb.MongoClient;

const ObjectID = mongodb.ObjectID;

servidor.use(express.static("public"));
servidor.use(express.urlencoded({ extended: false }));
servidor.use(express.json());

let db;

MongoClient.connect("mongodb://localhost:27017", (err, client) => {
  if (err !== null) {
    console.log(err);
  } else {
    db = client.db("hotel");
    console.log("MongoDB está funcionando correctamente");
  }
});

servidor.post("/registro", (req, res) => {
  const usuario = req.body;

  db.collection("clients").insertOne(usuario, function (err, datos) {
    if (err !== null) {
      res.send(err);
    } else {
      res.send(datos);
    }
  });
});

servidor.put("/editarcliente", (req, res) => {
  const dni = req.body.dni;

  const cliente = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
  };

  db.collection("clients").updateOne(
    { dni: dni },
    { $set: cliente },
    function (err, datos) {
      if (err !== null) {
        res.send(err);
      } else {
        res.send(datos);
      }
    }
  );
});

servidor.post("/checkin", (req, res) => {
  const checkin = req.body;

  db.collection("clients")
    .find({ dni: checkin.dni })
    .toArray(function (err, cliente) {
      if (err !== null) {
        res.send(err);
      } else {
        if (cliente.length === 0) {
          res.send({ mensaje: "El cliente no está registrado" });
        } else {
          db.collection("rooms")
            .find({ numero: checkin.numero })
            .toArray(function (err, habitacion) {
              if (err !== null) {
                res.send(err);
              } else {
                if (habitacion[0].estado === "ocupada") {
                  res.send({
                    mensaje: "La habitación seleccionada no está disponible",
                  });
                } else {
                  db.collection("reservas").insertOne(
                    {
                      numero: checkin.numero,
                      dni: checkin.dni,
                      fechaCheckIn: checkin.checkin,
                    },
                    function (err, datos) {
                      if (err !== null) {
                        res.send(err);
                      } else {
                        db.collection("rooms").updateOne(
                          { numero: checkin.numero },
                          { $set: { estado: "ocupada" } },
                          function (err, data) {
                            if (err !== null) {
                              res.send(err);
                            } else {
                              res.send({ mensaje: "Reserva realizada" });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            });
        }
      }
    });
});

servidor.put("/checkout", (req, res) => {
  const dni = req.body.dni;
  const fechaFin = req.body.checkout;

  db.collection("reservas")
    .find({ dni: dni })
    .toArray(function (err, reserva) {
      if (err !== null) {
        res.send(err);
      } else {
        if (reserva.length === 0) {
          res.send({ mensaje: "Falta realizar una reserva" });
        } else {
          db.collection("reservas").updateOne(
            { dni: dni },
            { $set: { fechaChecOut: fechaFin } },
            function (err, datos) {
              if (err !== null) {
                res.send(err);
              } else {
                db.collection("rooms").updateOne(
                  { numero: reserva[0].numero },
                  { $set: { estado: "libre" } },
                  function (err, data) {
                    if (err !== null) {
                      res.send(err);
                    } else {
                      res.send({ mensaje: "Gracias por su confianza" });
                    }
                  }
                );
              }
            }
          );
        }
      }
    });
});

servidor.listen(3000);
