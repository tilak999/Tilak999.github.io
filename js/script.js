$(document).ready(function(){

	$(".hello").click(function(){
		$(".hello").toggleClass("full");
		$(".welcome").toggleClass("full");
		console.log("ok");
	})

	window.onscroll = function() {myFunction()};
});

var full_width = false;

function myFunction() 
{
    if (document.body.scrollTop > 50 && full_width == false) 
    {
    	full_width = true;
    	$(".hello").toggleClass("full");
		$(".welcome").toggleClass("full");
		setTimeout(function(){
			$(".full-page").hide();
		},500);

		window.scrollTo(0,100);
    }
    else if (document.body.scrollTop < 50 && full_width) 
    {
    	full_width = false;
    	$(".full-page").show();
    	$(".hello").toggleClass("full");
		$(".welcome").toggleClass("full");
    }
}