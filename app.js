'use strict'

let wit = require('node-wit').Wit;

const accessToken = (() => {
    if (process.argv.length != 3) {
        console.log('Usage: node app.js <wit-access-token>');
        process.exit(1);
    }
    return process.argv[2];
})();

const firstEntityValue = (entities, entityStr) => {
    const val = entities && entities[entityStr] && Array.isArray(entities[entityStr])
        && entities[entityStr].length > 0 && entities[entityStr][0].value;
    if (!val)
        return null;
    return (typeof val === 'object') ? val.value : val;
};

function clearFlags(context) 
{
    delete context.location_set;
    delete context.location_unset;
    delete context.unknown_location;
    delete context.not_current_location;
    delete context.missing_location;
    delete context.bus_address;
    delete context.train_address;
    delete context.unknown_location_bus;
    delete context.unknown_location_train;
}

const actions = {
    send(request, response) {
        const {sessionId, context, entities} = request;
        const {text, quickreplies} = response;
        return new Promise(

            function(resolve, reject) {
                console.log('User said: ', request.text);
                console.log('Sending: ', JSON.stringify(response));
                return resolve();
            }

        );
    },

    searchForBusStation({context, entities}) {
        return new Promise(function(resolve, reject) {
            clearFlags(context);
            var location = firstEntityValue(entities, 'location');
            if (!location)
                location = context.currentLocation;
            if (location)
            {
                context.bus_address = "Dirección de la estación de autobuses " + location;
                delete context.missing_location;
            }
            else
            {
                context.missing_location = true;
                delete context.bus_address;
            }
            return resolve(context);
        });
    },
    searchForTrainStation({context, entities}) {
        return new Promise(function(resolve, reject) {
            clearFlags(context);
            var location = firstEntityValue(entities, 'location');
            if (!location)
                location = context.currentLocation;
            if (location)
            {
                context.train_address = "Dirección de la estación de trenes " + location;
                delete context.missing_location;
            }
            else
            {
                context.missing_location = true;
                delete context.train_address;
            }
            return resolve(context);
        });
    },
    setLocation({context, entities}) {
        return new Promise(function(resolve, reject) {
            clearFlags(context);
            var location = firstEntityValue(entities, 'location');
            //TODO: more checks
            if (location)
            {
                context.currentLocation = location;
                context.location_set = true;
                delete context.unknown_location;
                //delete context.location_unset;
            }
            //console.log('setLocation(): bus_address=' + context.bus_address + ' train_address = ' + context.train_address);
            return resolve(context);
        });
    },
    unsetLocation({context, entities}) {
        return new Promise(function(resolve, reject) {
            clearFlags(context);
            var location = firstEntityValue(entities, 'location');
            //console.log('Inside unsetLocation(): location = ' + location + ' currentLocation = ' + context.currentLocation);
            if (context.currentLocation && location === context.currentLocation)
            {
                delete context.currentLocation;
                context.location_unset = true;
                delete context.not_current_location;
            }
            else
            {
                context.not_current_location = true;
                delete context.location_unset;
            }
            return resolve(context);
        });
    }
}


const client = new wit({accessToken, actions});
client.interactive();

