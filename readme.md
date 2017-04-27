# Documentation: #

### This is an application about comparing the best food in two different cities by using Yelp Api. ###

## 1.Idea Behind this project: ##

Compare a specific food, like sushi, hotpot or BBQ in two different cities, and to see which city has the largest number of restaurants which serving the best food.Users has to input two cities' name first, and then choose a specific food.Lastly,they need choose the rating of the restaurants.Here it is suggested that the higher rating of a restaurant the better quality of the food.

![promisechains](https://cloud.githubusercontent.com/assets/13953268/25488074/1278a956-2b34-11e7-9b58-e2057b39bff6.png)

## 2.About API I used: ##

Here I used Yelp <a href="https://www.yelp.com/developers/documentation/v2/search_api">Fusion's Search Api</a>: General search parameters: term, sort(rating), location
This is a coding example about how to start to use yelp fusion api.<a href="https://github.com/Yelp/yelp-fusion/tree/master/fusion/node">See the example</a>

![1](https://cloud.githubusercontent.com/assets/13953268/25488548/51ac1be8-2b35-11e7-92ed-8eaad12acafe.png)

![2](https://cloud.githubusercontent.com/assets/13953268/25488588/67552070-2b35-11e7-88d8-c91e4950a04b.png)

![3](https://cloud.githubusercontent.com/assets/13953268/25488609/731cf810-2b35-11e7-90c9-410577134227.png)

![4](https://cloud.githubusercontent.com/assets/13953268/25488611/74bf800c-2b35-11e7-974c-eb9f97d79c07.png)

## 3.About Code:##
I used Fetch.js to request user input data information and send to app.js, and then the app.js connects to the api and do the math and then send the results back to Fetch, after parsing the result from a string to a object, I can use a function to create barchart.

Code in the createform.html, create a form and build fetch function and create chart function:

```
 <button onclick="getForm()" class="submit centerMe">Submit</button>
 <script>
    function getForm() {
       
        var foodValue = document.querySelector('input[name=Food]:checked').value;
        var city1value = document.querySelector('input[name=LocationA]').value;
        var city2value = document.querySelector('input[name=LocationB]').value;
        var ratevalue = document.querySelector('input[name=Rate]:checked').value;
        
        var formData = new FormData();
        formData.append('Food', foodValue);
        formData.append('LocationA', city1value);
        formData.append('LocationB', city2value);
        formData.append('Rate', ratevalue);

        fetch("/form", {
            method: "POST",
            body: formData
        }).then(function (response) {
            console.log(response);
            return response.text();
        }).then(function (text) {
            //console.log(text);
            var resp = JSON.parse(text);
            console.log(resp);
            createChart(resp["loc1"],resp["loc2"],resp["loc1count"],resp["loc2count"])
        });
    }
</script>
<script type="text/javascript" src="js/Chart.bundle.min.js"></script>
<script>

    function createChart(loc1,loc2,loc1count,loc2count) {
        var ctx = document.getElementById("myChart");
        var keys = [loc1, loc2];
        var values = [loc1count,loc2count];
        var barcolors = 'rgba(' + 245 + ',' + 166 + ',' + 35 + ',' + 100 + ')';

        var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: keys,
                datasets: [{
                    label: 'Number of Restaurants',
                    data: values,
                    backgroundColor: barcolors
                        }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                            }]
                }
            }
        });
    }
</script>
```

Code in the app.js: require api and fetch library
```
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
                

                
                reply(response);
    
            }).catch(e => {
                console.log(e);
            });
        }).catch(e => {
                console.log(e);
            });
        }
    });

```





