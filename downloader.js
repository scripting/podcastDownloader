var myVersion = "0.40", myProductName = "podcastDownloader"; 
 
	//The MIT License (MIT)
	
	//Copyright (c) 2015 Dave Winer
	
	//Permission is hereby granted, free of charge, to any person obtaining a copy
	//of this software and associated documentation files (the "Software"), to deal
	//in the Software without restriction, including without limitation the rights
	//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	//copies of the Software, and to permit persons to whom the Software is
	//furnished to do so, subject to the following conditions:
	
	//The above copyright notice and this permission notice shall be included in all
	//copies or substantial portions of the Software.
	
	//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	//SOFTWARE.
	
var fs = require ("fs");
var request = require ("request");

var fnameConfig = "config.json", config = {
	enabled: true,
	urlRiver: "http://rssforpodcatch.scripting.com/rivers/podcasts.js",
	folder: "podcatcher/",
	maxFileNameLength: 32,
	idsSeen: new Array ()
	};
var flScheduledEveryMinute = false;


function fsSureFilePath (path, callback) { 
	var splits = path.split ("/");
	path = ""; //1/8/15 by DW
	if (splits.length > 0) {
		function doLevel (levelnum) {
			if (levelnum < (splits.length - 1)) {
				path += splits [levelnum] + "/";
				fs.exists (path, function (flExists) {
					if (flExists) {
						doLevel (levelnum + 1);
						}
					else {
						fs.mkdir (path, undefined, function () {
							doLevel (levelnum + 1);
							});
						}
					});
				}
			else {
				if (callback != undefined) {
					callback ();
					}
				}
			}
		doLevel (0);
		}
	else {
		if (callback != undefined) {
			callback ();
			}
		}
	}
function writeStats (f, stats) {
	fsSureFilePath (f, function () {
		fs.writeFile (f, JSON.stringify (stats, undefined, 4), function (err) {
			if (err) {
				console.log ("writeStats: error == " + err.message);
				}
			});
		});
	}
function readStats (f, stats, callback) {
	fsSureFilePath (f, function () {
		fs.exists (f, function (flExists) {
			if (flExists) {
				fs.readFile (f, function (err, data) {
					if (err) {
						console.log ("readStats: error reading file " + f + " == " + err.message)
						}
					else {
						var storedStats = JSON.parse (data.toString ());
						for (var x in storedStats) {
							stats [x] = storedStats [x];
							}
						writeStats (f, stats);
						}
					if (callback != undefined) {
						callback ();
						}
					});
				}
			else {
				writeStats (f, stats);
				if (callback != undefined) {
					callback ();
					}
				}
			});
		});
	}
function httpReadUrl (url, callback) {
	request (url, function (error, response, body) {
		if (!error && (response.statusCode == 200)) {
			callback (body) 
			}
		});
	}
function stringDelete (s, ix, ct) {
	var start = ix - 1;
	var end = (ix + ct) - 1;
	var s1 = s.substr (0, start);
	var s2 = s.substr (end);
	return (s1 + s2);
	}
function stringMid (s, ix, len) { //8/12/14 by DW
	return (s.substr (ix-1, len));
	}
function stringLastField (s, chdelim) { //8/27/14 by DW
	var ct = stringCountFields (s, chdelim);
	if (ct == 0) { //8/31/14 by DW
		return (s);
		}
	return (stringNthField (s, chdelim, ct));
	}
function stringCountFields (s, chdelim) {
	var ct = 1;
	if (s.length == 0) {
		return (0);
		}
	for (var i = 0; i < s.length; i++) {
		if (s [i] == chdelim) {
			ct++;
			}
		}
	return (ct)
	}
function stringNthField (s, chdelim, n) {
	var splits = s.split (chdelim);
	if (splits.length >= n) {
		return splits [n-1];
		}
	return ("");
	}
function multipleReplaceAll (s, adrTable, flCaseSensitive, startCharacters, endCharacters) { 
	if(flCaseSensitive===undefined){
		flCaseSensitive = false;
		}
	if(startCharacters===undefined){
		startCharacters="";
		}
	if(endCharacters===undefined){
		endCharacters="";
		}
	for( var item in adrTable){
		var replacementValue = adrTable[item];
		var regularExpressionModifier = "g";
		if(!flCaseSensitive){
			regularExpressionModifier = "gi";
			}
		var regularExpressionString = (startCharacters+item+endCharacters).replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
		var regularExpression = new RegExp(regularExpressionString, regularExpressionModifier);
		s = s.replace(regularExpression, replacementValue);
		}
	return s;
	}
function maxLengthString (s, maxlength) { //8/27/14 by DW
	if (s.length > maxlength) {
		s = s.substr (0, maxlength);
		while (true) {
			var len = s.length; flbreak = false;
			if (len == 0) {
				break;
				}
			if (s [len - 1] == " ") {
				flbreak = true;
				}
			s = s.substr (0, len - 1);
			if (flbreak) {
				break;
				}
			}
		s = s + "...";
		}
	return (s);
	}
function goodFilename (fname) {
	var replacetable = {
		":": "-",
		"/": "-",
		"\\": "-"
		}
	fname = multipleReplaceAll (fname, replacetable);
	fname = maxLengthString (fname, config.maxFileNameLength);
	return (fname);
	}
function secondsSince (when) { 
	var now = new Date ();
	when = new Date (when);
	return ((now - when) / 1000);
	}
function downloadBigFile (url, f, pubDate) {
	var whenstart = new Date ();
	fsSureFilePath (f, function () {
		var theStream = fs.createWriteStream (f);
		theStream.on ("finish", function () {
			console.log ("downloadBigFile: took " + secondsSince (whenstart) + " secs, file == " + f);
			pubDate = new Date (pubDate);
			fs.utimes (f, pubDate, pubDate, function () {
				});
			});
		request.get (url)
			.on ('error', function (err) {
				console.log ("downloadBigFile error == " + err);
				})
			.pipe (theStream);
		});
	}
function everyMinute () {
	console.log ("\neveryMinute: " + new Date ().toLocaleTimeString ());
	function idInArray (id) {
		for (var i = 0; i < config.idsSeen.length; i++) {
			if (config.idsSeen [i] === id) {
				return (true);
				}
			}
		return (false);
		}
	function removeOldIds (theRiver) {
		var idsInRiver = new Array (), feeds = theRiver.updatedFeeds.updatedFeed;
		for (var i = 0; i < feeds.length; i++) {
			var feed = feeds [i];
			for (var j = 0; j < feed.item.length; j++) {
				var item = feed.item [j];
				idsInRiver [idsInRiver.length] = item.id;
				}
			}
		for (var i = 0; i < config.idsSeen.length; i++) {
			var flNotThere = true;
			for (var j = 0; j < idsInRiver.length; j++) {
				if (idsInRiver [j] == config.idsSeen [i]) {
					flNotThere = false;
					break;
					}
				}
			if (flNotThere) {
				//console.log ("removeOldIds: Deleting config.idsSeen [" + i + "] because it's no longer in the river.");
				config.idsSeen.splice (i, 1);
				}
			}
		}
	readStats (fnameConfig, config, function () {
		if (config.enabled) {
			httpReadUrl (config.urlRiver, function (s) {
				var prefix = "onGetRiverStream (", now = new Date ();
				s = stringDelete (s, 1, prefix.length);
				s = stringMid (s, 1, s.length - 1);
				var theRiver = JSON.parse (s);
				var feeds = theRiver.updatedFeeds.updatedFeed;
				for (var i = 0; i < feeds.length; i++) {
					var feed = feeds [i];
					for (var j = 0; j < feed.item.length; j++) {
						var item = feed.item [j];
						if (item.enclosure !== undefined) {
							var theEnclosure = item.enclosure [0];
							if ((theEnclosure != undefined) && (theEnclosure.url != undefined)) {
								if (!idInArray (item.id)) {
									config.idsSeen [config.idsSeen.length] = item.id;
									removeOldIds (theRiver);
									writeStats (fnameConfig, config); 
									var subfoldername = goodFilename (feed.feedTitle);
									var fname = stringLastField (theEnclosure.url, "/");
									fname = stringNthField (fname, "?", 1);
									var f = config.folder + subfoldername + "/" + fname;
									console.log ("\nDownloading podcast from feed: " + feed.feedTitle + ".");
									downloadBigFile (theEnclosure.url, f, item.pubDate);
									return; //only download one enclosure per minute
									}
								}
							}
						}
					}
				});
			}
		});
	}
function everySecond () {
	if (!flScheduledEveryMinute) {
		if (new Date ().getSeconds () == 0) {
			setInterval (everyMinute, 60000); 
			flScheduledEveryMinute = true;
			everyMinute (); //it's the top of the minute, we have to do one now
			}
		}
	}
function startup () {
	everyMinute (); //do a check immediately on starting up
	setInterval (everySecond, 1000); 
	}
startup ();
