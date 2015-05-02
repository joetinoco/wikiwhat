/* 
 * WikiWhat Javascript/JQuery source
 * by Joseph Tinoco - Winter/spring 2015
 */

// List of languages and countries (for the flags)
var LANGUAGE_LOCALE = {
af: "ZA",
ar: "SA",
az: "AZ",
be: "BY",
bs: "BA",
bg: "BG",
bn: "BD",
ca: "ES",
cs: "CZ",
da: "DK",
de: "DE",
div: "MV",
el: "GR",
en: "US",
es: "ES",
et: "EE",
eu: "ES",
fa: "IR",
fi: "FI",
fo: "FO",
fr: "FR",
ga: "IE",
gl: "ES",
gu: "IN",
he: "IL",
hi: "IN",
hr: "HR",
hu: "HU",
ht: "HT",
hy: "AM",
id: "ID",
is: "IS",
it: "IT",
ja: "JP",
ka: "GE",
kk: "KZ",
kn: "IN",
ko: "KR",
kok: "IN",
ky: "KG",
lt: "LT",
lv: "LV",
mk: "MK",
mn: "MN",
mr: "IN",
ms: "MY",
my: "MY",
nb: "NO",
nl: "NL",
nn: "NO",
no: "NO",
pa: "IN",
pl: "PL",
pt: "BR",
ro: "RO",
ru: "RU",
sa: "IN",
scn: "IT",
sh: "RS",
sk: "SK",
sl: "SI",
so: "SO",
sq: "AL",
sr: "RS",
sv: "SE",
sw: "KE",
syr: "SY",
ta: "IN",
te: "IN",
th: "TH",
tr: "TR",
tt: "RU",
uk: "UA",
ur: "PK",
uz: "UZ",
vi: "VN",
zh: "CN"
};

// Adjusts the language combo according to the browser language
var userLang = navigator.language || navigator.userLanguage;
userLang = userLang.split('-')[0];
$( "#ddlLangFrom" ).val(userLang);
if (userLang == "en") $( "#ddlLangTo" ).val("fr");
else $( "#ddlLangTo" ).val("en");

var originalContainerHeight = $( "#container" ).height();
var originalSummaryHeight = $( "#wikiSummary" ).height();

function clearTxtField(){
    $( "#txtField" ).val("");
}

function retriggerSearch(){
    // Used when the user changes the value in the "to" language drop-down.
    retrieveLanguages( null, null );
}

function findFirstImg(DOMnode, imgName){
    // Recursive search in the node hierarchy to find the first <img>
    console.log(DOMnode);
    var returnString = "";
    
    if(typeof DOMnode != 'undefined'){
        if(DOMnode.length > 0){
            // Tree root
            for (j=0; (j<DOMnode.length && returnString == ""); j++)
                returnString = findFirstImg(DOMnode[j],imgName);
            return returnString;
        }
        if (DOMnode.nodeName == "IMG") {
            console.log(DOMnode.currentSrc + " " + imgName);
            if (DOMnode.currentSrc.search(imgName) > -1) {
                returnString = DOMnode.currentSrc;
                console.log("Found it!");
            }
            return returnString;
        }
        else if(DOMnode.childNodes.length > 0) {
            for (i=0; (i<DOMnode.childNodes.length && returnString == ""); i++){
                returnString = findFirstImg(DOMnode.childNodes[i],imgName);
            }
            return returnString;
        }
        return returnString;
    }
    return returnString;
}

// Retrieves the language list and displays the flags.
function retrieveLanguages (event, ui) {
    $( "#wikiSummary" ).hide();
    $( "#rightColumn" ).hide();
    $( "#wikiSummary" ).text("");
    $( "#rightColumn" ).text("");
    if (ui)
        searchTerm = ui.item.label;
    else searchTerm = $( "#txtField" ).val();
    // Retrieves the list of every available translation of this article
    $.getJSON("http://" + $( "#ddlLangFrom" ).val() + ".wikipedia.org/w/api.php?action=parse&format=json&redirects&callback=?",
        {page:searchTerm, prop:"langlinks"}, 
        function( data ) {
            languages = data.parse.langlinks;
            var lang;
            var resultsCount = 0;
            var langToSearchTerm = "", langToWikiURL = "";
            for ( lang in languages ){
                langcode = languages[lang].lang;
                if (langcode.indexOf("-") > -1)
                    langcode = langcode.substring(0,langcode.indexOf("-"));
                // Stores the name and URL for the to-language article page, to use further ahead
                if ($( "#ddlLangTo" ).val() == langcode){ 
                    langToSearchTerm = languages[lang]["*"];
                    langToWikiURL = languages[lang].url;
                }
                // Displays links with flags for every available translation of this article 
                if (LANGUAGE_LOCALE[langcode]){ // Only displays the link if there is a flag for that language code
                        imgfile = "<img src='images/" + LANGUAGE_LOCALE[langcode].toLowerCase() + ".png'\n\
                                        alt='Language code " + languages[lang].lang + "'>";
                        $( "#rightColumn" ).append( "<span class='resultItem'>" + 
                            "<a href='" + languages[lang].url + "'>" +
                            imgfile + 
                            languages[lang]["*"] + "</br>" +
                            "<small>" +languages[lang].langname + "</small></a></span>"
                    );
                    resultsCount++;
                }
            }
            
            if (resultsCount == 0)
                $( "#rightColumn" ).append( "<span class='resultItem'>" + 
                            "This article is only available in " +
                            $( "#ddlLangFrom :selected" ).text() + " :(" +
                            "</span>");
            
            if (langToSearchTerm == ""){
                // This happens if the user selects the same language in the "from" and 
                // "to" combos, or the article has no available translations.
                // So, let's get the article from the base ("from") language.
                langToSearchTerm = searchTerm;
            }
            
            // Determines which Wikipedia version (language) to use to retrieve the summary
            var localeWiki;
            if(resultsCount > 0) localeWiki = $( "#ddlLangTo" ).val();
            else {
                // Might retrieve the article from the "from" language Wikipedia if it does not have any translations.
                localeWiki = $( "#ddlLangFrom" ).val();
            }
                
            // Retrieves the article and displays a summary of it in the left column
            $.ajax({
                url: "http://" + localeWiki + ".wikipedia.org/w/api.php?action=parse&page=" + 
                        langToSearchTerm + "&format=json&redirects&callback=?",
                dataType: "json",
                success: function( data ) {
                    if ( !data.error ){
                        var wikiHTML = $.parseHTML(data.parse.text["*"]);
                        var summaryP = "";
                        var summaryImg = "";
                        $.each(wikiHTML, function ( i, val){
                            // The first <p> is used for text.
                            if (val.nodeName == "P"){
                                if (summaryP == "")
                                    summaryP = val.textContent;
                            }
                        });
                        // The first image is also used.
                        //console.log(wikiHTML);
                        //summaryImg == findFirstImg(wikiHTML, data.parse.images[0]);
                        //$( "#wikiSummary" ).append(summaryImg);
                        
                        $( "#wikiSummary" ).append("<h2>" + data.parse.title + "</h2>");
                        $( "#wikiSummary" ).append("<p>" + summaryP + "</p>");
                        $( "#wikiSummary" ).append("<p><a href='" + langToWikiURL + "'>Full Wikipedia article</a>");
                    } else {
                        $( "#wikiSummary" ).append("<p>The selected article is not available in the desired language. Try selecting one of the options shown on the right.</p>");
                    }
                    // Fixes the container size before displaying results,
                    // depending on the number of flags/links to show, or the
                    // summary height.
                    var newContainerHeight;
                    if(resultsCount > 0){
                        newContainerHeight = originalContainerHeight + 
                                ((resultsCount>2 ? resultsCount-2 : resultsCount) * 
                                $( ".resultItem" ).outerHeight(true));
                    } else {
                        if (originalSummaryHeight < $( "#wikiSummary" ).outerHeight(true))
                            newContainerHeight = originalContainerHeight + 
                                ($( "#wikiSummary" ).outerHeight(true) - originalSummaryHeight);
                        else newContainerHeight = originalContainerHeight; 
                    }
                    $( "#container" ).css("height", newContainerHeight + "px");
                    
                    $( "#wikiSummary" ).fadeIn(500);
                    $( "#rightColumn").fadeIn(500);
                }
            });
        }
    );
}

// Set up the autocomplete for the text field
$( "#txtField" ).autocomplete({
    source: function( request, response ) {
        $.ajax({
          url: "http://" + $( "#ddlLangFrom" ).val() + ".wikipedia.org/w/api.php?action=opensearch&search=" + 
                  request.term + "&format=json&callback=spellcheck",
          dataType: "jsonp",
          success: function( data ) {
              response( data[1] );
          }
        });
        },
        minLength: 3,
        delay: 200,
        // This callback does the rest of the functionality
        select: function( event, ui ){
            retrieveLanguages(event,ui);
        }
});