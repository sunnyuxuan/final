'use strict';

const Hapi = require('hapi');
const Blipp = require('blipp');
const Vision = require('vision');
const Inert = require('inert');
const Path = require('path');
const Handlebars = require('handlebars');
const fs = require("fs");
const Sequelize = require('sequelize');
const pg = require('pg');
const Fetch = require("node-fetch");
const FormData = require("form-data");

var config = require('./config.js');

//yelp
const yelp = require('yelp-fusion');

var client;

const token = yelp.accessToken(config.clientId, config.clientSecret).then(response => {
    console.log(response.jsonBody.access_token);
    client = yelp.client(response.jsonBody.access_token);

}).catch(e => {
    console.log(e);
});

const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    }
});

var sequelize;


server.connection({
    port: (process.env.PORT || 3000)
});


if (process.env.DATABASE_URL) {
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: true //false
    })
} else {
    sequelize = new Sequelize('db', 'username', 'password', {
        host: 'localhost',
        dialect: 'sqlite',

        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },

        // SQLite only
        storage: 'db.sqlite'
    });
}


var User = sequelize.define('user', {
    Food: {
        type: Sequelize.STRING
    },
    LocationA: {
        type: Sequelize.STRING
    },
    LocationB: {
        type: Sequelize.STRING
    },
    Rate: {
        type: Sequelize.INTEGER
    }
});



server.register([Blipp, Inert, Vision], () => {});


server.views({
    engines: {
        html: Handlebars
    },
    path: Path.join(__dirname, 'views'),
    layoutPath: 'views/layout',
    layout: 'layout',
    helpersPath: 'views/helpers',
    //partialsPath: 'views/partials'
});


server.route({
    method: 'GET',
    path: '/',
    handler: {
        view: {
            template: 'createform'
        }
    }
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: './',
            listing: false,
            index: false
        }
    }
});

server.route({
    method: 'GET',
    path: '/createDB',
    handler: function (request, reply) {
        // force: true will drop the table if it already exists
        User.sync({
            force: true
        })
        reply("Database Created")
    }
});



server.route({

    method: 'POST',
    path: '/add',
    handler: function (request, reply) {
        var formresponse = JSON.stringify(request.payload);
        var parsing = JSON.parse(formresponse);


        User.create(parsing).then(function (currentUser) {
            User.sync();
            console.log("...syncing");
            console.log(currentUser);
            return (currentUser);
        }).then(function (currentUser) {

            reply().redirect("/displayAll");

        });
    }
});


server.route({
    method: 'GET',
    path: '/destroyAll',
    handler: function (request, reply) {

        User.drop();

        reply("The datas have been all destroyed");
    }
});

server.route({
    method: 'GET',
    path: '/destroyAll/{id}',
    handler: function (request, reply) {


        User.destroy({
            where: {
                id: encodeURIComponent(request.params.id)
            }
        });

        reply().redirect("/displayAll");
    }
});


server.route({
    method: 'GET',
    path: '/update/{id}',
    handler: function (request, reply) {
        var id = encodeURIComponent(request.params.id);


        reply.view('updatedata', {
            routeId: id
        });
    }

});

server.route({
    method: 'POST',
    path: '/update/{id}',
    handler: function (request, reply) {
        var id = encodeURIComponent(request.params.id);
        var formresponse = JSON.stringify(request.payload);
        var parsing = JSON.parse(formresponse);
        //console.log(parsing);

        User.update(parsing, {
            where: {
                id: id
            }
        });

        reply().redirect("/displayAll");

    }

});

//server.route({
//    method: 'GET',
//    path: '/createform',
//    handler: {
//        view: {
//            template: 'createform'
//        }
//    }
//});



server.route({
    method: 'GET',
    path: '/displayAll',
    handler: function (request, reply) {
        User.findAll().then(function (users) {
            // projects will be an array of all User instances
            //console.log(users[0].monsterName);
            var allUsers = JSON.stringify(users);
            reply.view('dbresponse', {
                dbresponse: allUsers
            });
        });
    }
});

server.route({
    method: 'GET',
    path: '/form',
    handler: {
        view: {
            template: 'formresponse'
        }
    }
});

server.route({
    method: 'POST',
    path: '/form',
    handler: function (request, reply) {

var Food = request.payload.Food;
var LocationA = request.payload.LocationA;
var LocationB = request.payload.LocationB;
var Rate = request.payload.Rate;
        
       console.log(Food);
       console.log(LocationA);
       console.log(LocationB);
       
       
        client.search({
            term: Food,
            location: LocationA,
            sort_by: "rating"
        }).then(function (response) {
            //console.log(response.jsonBody.businesses);
            
            //loop and count 5 star restaurants
            var allbusiness = response.jsonBody.businesses;
            var loc1count = 0;
            
            //var curRate = parseFloat(Rate);
            //console.log(curRate);
           
            for (var x in allbusiness) {
                
                if(allbusiness[x]["rating"] > parseFloat(Rate))
                loc1count++;
            };

            client.search({
                term: Food,
                location: LocationB,
                sort_by: "rating"
            }).then(function (response) {
                //count second location
            var allbusiness2 = response.jsonBody.businesses;
            var loc2count = 0;
           
            for (var y in allbusiness2) {
                if(allbusiness2[y]["rating"] > parseFloat(Rate))
                   loc2count++; 
            
            };
                
                // log of first location count
                console.log(loc1count);
                console.log(loc2count);
                //render your template
//                
    var response = {
        loc1: LocationA, 
        loc2: LocationB, 
        loc1count: loc1count,
        loc2count: loc2count
    };
                
//            reply.view('barchart',{
//                formresponse: response
//            },{layout: 'none'});
                
                reply(response);
    
            }).catch(e => {
                console.log(e);
            });
        }).catch(e => {
                console.log(e);
            });
        }
    });


server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);

});

