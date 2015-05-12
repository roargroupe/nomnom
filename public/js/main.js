var place,autocomplete,map,marker,
	addButton = document.querySelector('#add'),
	getUsersButton = document.querySelector('#getusers');

function initialize() {
	var defaultBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(40.49137,-74.25909),
		new google.maps.LatLng(40.915256,-73.700272)
	);
	var mapOptions = {
	  center: { lat: 40.7285513, lng: -74.0074282},
	  zoom: 8,
	},
	options = {
		bounds: defaultBounds
	};
	
	autocomplete = new google.maps.places.Autocomplete(document.querySelector('#fsname'), options)
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	google.maps.event.addListener(autocomplete, 'place_changed', function() {
    getAddress();
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

function getAddress(){

	place = autocomplete.getPlace();
	
	buildPlaceInfo(place);
	
	if(marker !== undefined){
		marker.setMap(null);
	}

	marker = new google.maps.Marker({
		position: new google.maps.LatLng(place.geometry.location.A, place.geometry.location.F),
		map: map,
		animation: google.maps.Animation.DROP,
		title: place.name
	});

	map.setZoom(14);
	map.setCenter(new google.maps.LatLng(place.geometry.location.A, place.geometry.location.F));
	console.log(place);
	// set hidden inputs
	document.querySelector('#location').value = place.formatted_address;
	document.querySelector('#latlng').value = JSON.stringify({lat: place.geometry.location.A, lng: place.geometry.location.F});
	document.querySelector('#rating').value = place.rating;
	document.querySelector('#price').value = place.price_level;
	document.querySelector('#website').value = place.website;
	document.querySelector('#phone').value = place.formatted_phone_number;
}

function buildPlaceInfo(place){
	var html = '', moneyHTML = '';
	document.querySelector('.location-info').innerHTML = '';
	html += '<h4 class="location-name">'+place.name+'</h4>';
	/*html += '<div class="photo-container cf">';
		for(var x = 0; x < place.photos.length; x++){
			html += '<div class="fs-photo"><img src="'+place.photos[x].getUrl()+'"></div>';
		}
		html += '<div class="fs-photo"><img src="'+place.photos[0].getUrl()+'"></div>';
	html += '</div>';*/
	if(place.rating !== null){
		html += '<span><strong>Rating: </strong>'+place.rating+'</span>';
	}else{
		html += '<span><strong>Rating: </strong>None</span>';
	}
	if(place.price_level !== null){
		for(var i = 0; i < place.price_level; i++){
			moneyHTML += '<i class="mdi-editor-attach-money"></i>';
		}
		html += '&nbsp;&nbsp;&nbsp;<span><strong>Price: </strong>'+moneyHTML+'</span>';
	}else{
		html += '&nbsp;&nbsp;&nbsp;<span><strong>Price: </strong>Not Sure</span>';
	}
	
	html += '<br>';
	if(place.website !== null){
		html += '<span><strong>Website: </strong><a target="_blank" href="'+place.website+'">'+place.name+'</a></span><br>';
	}else{
		html += '<span><strong>Website: </strong>Not Available</span><br>';
	}
	if(place.formatted_phone_number !== null){
		html += '<span><strong>Phone: </strong><a href="tel:'+place.formatted_phone_number+'">'+place.formatted_phone_number+'</a></span>';
	}else{
		html += '<span><strong>Phone: </strong>Not Available</span>';
	}
	html += '<p>';
	html += '<span><strong>Hours: </strong></span><br>';
	if(place.opening_hours.weekday_text !== null){
		for(var j = 0; j < place.opening_hours.weekday_text.length; j++){
			html += '<span>'+place.opening_hours.weekday_text[j]+'</span><br>';
		}
	}else{
		html += '<span>Not Available</span>';
	}
	html += '</p>';
	
	document.querySelector('.location-info').innerHTML = html;
}

addButton.onclick = function(){
	var serData = {};
	serData.name = document.querySelector('#name').value;
	serData.email = document.querySelector('#email').value;
	serData.fsname = document.querySelector('.location-name').innerHTML;
	serData.location = document.querySelector('#location').value;
	serData.latlng = document.querySelector('#latlng').value;
	serData.rating = document.querySelector('#rating').value;
	serData.price = document.querySelector('#price').value;
	serData.website = document.querySelector('#website').value;
	serData.phone = document.querySelector('#phone').value;
	serData.votes = 1;

	$.ajax({
		type: 'POST',
		data: serData,
		url: '/nomnom/add/',
		success: function(data){
			console.log(data);
			alert('Your Foodspot has been added!');
		}
	});
};

getUsersButton.onclick = function(){
	$.ajax({
		type: 'GET',
		url: '/nomnom/getusers/',
		success: function(data){
			console.log(data);
			alert('Your users have been imported!');
		},
		error: function(err){
			console.log(err);
		}
	});
};










