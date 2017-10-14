var fs = require('fs');
var path = require('path');
/* osmosis for scrapping */
var osmosis = require('osmosis');
/* json file is for parsing and writing json file */
var jsonfile = require('jsonfile');
/* nodemailer is for sending emails to subscriber */
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
/* Lodash Methods */
var differenceWith = require('lodash/differenceWith');
var isEqual = require('lodash/isEqual');
var each = require('lodash/each');

/* json file path */
var theatreFile = path.resolve('./theatre.json');

/* subscribers email list */
var subscribers = ['arunprasadvit@gmail.com'];

setInterval(function() {
	var theatreList = [];
	if (fs.existsSync(theatreFile)) {
		jsonfile.readFile(theatreFile, function (err, obj) {
			theatreList = obj;
			scrapSite(theatreList);
		})
	} else {
		scrapSite();
	}
}, 10000);

function scrapSite(theatreList) {
	var newlyScrappedTheatres = [];
	osmosis
		.get('https://in.bookmyshow.com/buytickets/mersal-bengaluru/movie-bang-ET00058691-MT/20171018')
		.find('#venuelist > .list')
		.set({
			'name': '.listing-info .__venue-name',
			'timing': '.body>div',
		})
		.data(function (listing) {
			newlyScrappedTheatres.push(listing);
		})
		.done(function () {
			if (theatreList && theatreList.length) {
				var newTheatres = differenceWith(newlyScrappedTheatres, theatreList, isEqual);
				if (newTheatres && newTheatres.length) {
					var newTheatreMessage = newTheatres.length == 1 ? 'New theatre found' : 'New theatres found';
					var theatres = ''
					each(newTheatres, function (theatre) {
						theatres = theatres + (theatre.name + ', ');
					})
					sendEmail(subscribers, newTheatreMessage, theatres)
				} else {
					console.log('No new theatre found');
				}
			} else {
				console.log('No new theatre found');
			}
			jsonfile.writeFile(theatreFile, newlyScrappedTheatres, function (err) {
				console.log(err);
			})
		})
		.error(console.log)
}

function sendEmail(subscribers, subject, theatres) {
	var options = {
		auth: {
			api_user: 'arunprasad',
			api_key: 'cmango123'
		}
	}
	var transport = nodemailer.createTransport(sgTransport(options));

	var mail = {
		from: "Arun Prasad <arun@cartoonmango.com>",
		to: subscribers.toString(),
		subject: subject,
		text: theatres
	}

	transport.sendMail(mail, function (error, response) {
		if (error) {
			console.log(error);
		} else {
			console.log((subscribers.length == 1 ? "Mail send to following subscriber: " : "Mail send to following subscribers: ") + subscribers.toString());
		}

		transport.close();
	});

}