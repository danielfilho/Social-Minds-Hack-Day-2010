
var yqlquery = 'USE "http://github.com/irae/yql-tables/raw/master/formula1/formula1.races.xml?5" AS formula1.races;\n\
	USE "http://github.com/irae/yql-tables/raw/master/formula1/formula1.race.results.xml?5" AS formula1.race.results;\n\
	\n\
	select *\n\
	from formula1.race.results\n\
	where season="2009"\n\
	and race in (\n\
		select round from formula1.races where season="2009" \n\
	);';


function racesJsonPrettify(data) {
	var json = {};
	json.races = [];
	$.each(data.query.results.Races,function(i,oRace){
		var nRace = {
			name: oRace.raceName,
			results: []
		};
		for(var j=0;j<oRace.Results.length;j++) {
			var res = oRace.Results[j];
			var resOut = {
				pos: res.position,
				driver: res.Driver.givenName + ' ' + res.Driver.familyName,
				team: res.Constructor.name,
				laps: parseInt(res.laps,10),
				points: parseInt(res.points,10),
				status: res.status,
				grid: parseInt(res.grid,10),
				num: parseInt(res.number,10),
				driverId: res.Driver.driverId
			};
			if(res.Time) {
				resOut.time = res.Time.time;
			}
			nRace.results.push(resOut);
		}
		json.races.push(nRace);
	});
	return json;
};


var pixelPerPoints = 4;

var players = {};
var playerCount = 0;

function printDriverInfos(data) {
	console.debug(data.races);
	
	$.each(data.races,function(i,race){
		
		$.each(race.results,function(j,result){
			var driver = players[result.driverId] || (players[result.driverId] = {
				driver: result.driver,
				playerCount: ++playerCount,
				driverId: result.driverId,
				sumPoints: 0,
				racesRun:[]
			});
			driver.racesRun.push(i+1);
			driver.sumPoints += result.points;
		});
	});
	
	console.dir(players);
	
	var html = '';
	var posSufixes = ['st','nd','rd','th','th','th','th','th','th','th'];
	
	$.each(players,function(i,player){
		
		var pointsStack = 0;
		
		html += '<div id="player_'+player.playerCount+'" class="player '+player.driverId+'" style="top:'+((player.playerCount-1)*70)+'px">'+
			'<p class="total">'+player.sumPoints+'</p>'+
			'<progress class="round" value="'+player.sumPoints+'" max="'+(data.races.length*10)+'" style="width: '+(pixelPerPoints*player.sumPoints+2)+'px;">';
		
		
		$.each(data.races,function(j,race){
			var borderShift = 2;
			// if(j == 0) {
			// 	borderShift = 0;
			// }
			var hasRun = false;
			var thisRacePoints = 0;
			$.each(race.results,function(k,result){
				// console.info(result.driverId, player.driverId);
				if(result.driverId == player.driverId) {
					hasRun = true;
					thisRacePoints = result.points;
					thisRacePos = result.pos;
				}
			});
			if(!hasRun){
				thisRacePos = 'X';
			};
			
			// console.info(thisRacePos,player.driver);
			
			html += '\n\n<meter class="race race'+j+' '+race.name.toLowerCase().replace(/[\t ]/,'_')+'" value="'+thisRacePoints+'" min="0" max="10" style="width: '+(thisRacePoints*pixelPerPoints)+'px; left: '+(pointsStack*pixelPerPoints)+'px;">'+
						'<strong class="place">'+
							thisRacePos+'<span>'+(  posSufixes[ (thisRacePos % 10) -1 ] )+'</span>'+
						'</strong>'+
						'<span class="points">'+thisRacePoints+' points</span>'+
					'</meter>';
			pointsStack += thisRacePoints;
		});
		html += '	</progress>'+
			'<dl class="identity">'+
				'<dt class="name">'+player.driver.replace(/.* /,'')+'</dt>'+
				'<dd class="avatar character '+player.driverId+'">'+
					'<div><img src="_base/img/character_avatars.png" alt="'+player.driver+'" /></div>'+
				'</dd>'+
			'</dl>'+
		'</div>';
		// console.info(html);
	});
	
	$('#graph').css({
		height: (playerCount*70)+'px'
	}).append(html);
	
};

function printRaceTables(data) {
	printDriverInfos(data);
	var races = data.races;
	var driversSums = {};
	for (i in races){
		var article = document.createElement("article");
		article.className = "race race1 dry_dry_ruins";
		var html = '<h3>' + data.races[i].name + '</strong></h3>' +
		"<ol>";
		for (j in races[i].results){
			if (!driversSums[races[i].results[j].driverId]) {
				driversSums[races[i].results[j].driverId] = races[i].results[j].points;
			} else {
				driversSums[races[i].results[j].driverId] += races[i].results[j].points;
			}
			html +=	'<li class="player">' +
			'<h4>' + races[i].results[j].pos + '</h4>' +
			'<dl class="identity">' +  
			'<dt class="name">' + races[i].results[j].driver + '</dt>' +
			'<dd class="avatar character king_boo">' + 
			'<div><img src="_base/img/character_avatars.png" alt="King Boo" /></div>' +
			'</dd>' +
			'<dd class="points">+' + races[i].results[j].points + '</dd>' +
			'<dd class="score">' + driversSums[races[i].results[j].driverId] + '</dd>' + 
			'</dl>' +
			'</li>';
		}
		html += "</ol>";
		$(article).html(html);
		document.getElementById("round_races").getElementsByTagName("div")[0].appendChild(article);	
	}
	stageInit();
}


$.ajax({
	type: 'GET',
	dataType: 'jsonp',
	url:'http://query.yahooapis.com/v1/public/yql',
	data:{
		format:'json',
		q:yqlquery
	},
	error: function() {
		alert('Something wrong retrieving from YQL.')
	},
	success:function(data) {
		data = racesJsonPrettify(data);
		printRaceTables(data);
	}
});
