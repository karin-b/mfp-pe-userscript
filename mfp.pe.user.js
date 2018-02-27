// ==UserScript==
// @name            MyFitnessPal protein to energy ratio (P:E)
// @version         1.0
// @namespace       karin-b
// @description     Adds display of P:E ratio to any daily food diary page.
// @downloadURL     https://github.com/karin-b/mfp-pe-userscript
// @include         http*://www.myfitnesspal.com/food/diary*
// ==/UserScript==

/*
 *  ------------------------------------------------------------
 *  Based off of https://github.com/Surye/mfp-keto-userscript/raw/master/mfpketo.user.js
 *  ------------------------------------------------------------
 */

/*
if (window.top !== window.self) {
  return; // do not run in frames
}
*/
/*
if (typeof unsafeWindow != 'undefined')
{
  (function page_scope_runner() {
    // If we're _not_ already running in the page, grab the full source
    // of this script.
    var my_src = "(" + page_scope_runner.caller.toString() + ")();";

    // Create a script node holding this script, plus a marker that lets us
    // know we are running in the page scope (not the Greasemonkey sandbox).
    // Note that we are intentionally *not* scope-wrapping here.
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = my_src;
    document.body.appendChild(script);
  })();

  return;
}
*/
function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}

function startRun() {
    var script = document.createElement("script");
    script.setAttribute("src", "//www.google.com/jsapi");
    script.addEventListener('load', function() {
        exec(jsapiLoaded);
    }, false);
    document.body.appendChild(script);

    script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js");
    script.addEventListener('load', function() {
        exec("jQuery.noConflict()");
    }, false);
    document.body.appendChild(script);

    script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = main;
    document.body.appendChild(script);
}

startRun();

function jsapiLoaded() {
    google.load("visualization", "1", { packages: ["corechart"], "callback": main });
}

function main() {
    var calories_i = 0;
    var net_carbs_i = 0;
    var carbs_i = 0;
    var fiber_i = 0;
    var protein_i = 0;
    var fat_i = 0;

    var header_tr_element = jQuery('.food_container tr.meal_header:first');

    var elem_i = 0;
    header_tr_element.find('td').each(function() {
        var myval = jQuery(this).text().toLowerCase().trim();
        if (myval.indexOf('calories') !== -1) { calories_i = elem_i; }
        if (myval.indexOf('carbs') !== -1) { carbs_i = elem_i; }
        if (myval.indexOf('fiber') !== -1) { fiber_i = elem_i; }
        if (myval.indexOf('fat') !== -1) { fat_i = elem_i; }
        if (myval.indexOf('protein') !== -1) { protein_i = elem_i; }

        elem_i += 1;
    });

    // Add new column for protein:energy ratio
    var pe_tr_elements = jQuery('tr');
    pe_tr_elements.each(function() {
        var tds = jQuery(this).find('td');
        jQuery('<td></td>').insertBefore(tds.eq(elem_i));
    });

    // Set header
    header_tr_element.append('<td></td>');
    header_tr_element.find('td').eq(elem_i).text("P:E");
    header_tr_element.find('td').eq(elem_i).addClass("alt");
    header_tr_element.find('td').eq(elem_i).addClass("nutrient-column");

    // Change to say net carbs
    var footer_tr_element = jQuery('tfoot tr');
    footer_tr_element.find('td').eq(elem_i).text("P:E");
    footer_tr_element.find('td').eq(elem_i).addClass("alt");
    header_tr_element.find('td').eq(elem_i).addClass("nutrient-column");

    var food_tr_elements = jQuery('tr');

    food_tr_elements.each(function() {
        var tds = jQuery(this).find('td');
        var carbs = parseFloat(tds.eq(carbs_i).text());
        var fat = parseFloat(tds.eq(fat_i).text());
        var protein = parseFloat(tds.eq(protein_i).text());

        // Find only food rows!
        var delete_td = tds.eq(tds.length - 1);
        if (delete_td.hasClass('delete')) {
			var name = jQuery(this).find('.js-show-edit-food').text().toLowerCase();
			tds.eq(elem_i).text((protein / (fat + carbs)).toFixed(2));
        }
    });

    var bottom_tr_elements = jQuery('.food_container tr.bottom, .food_container tr.total');
    var meal_idx = 0;
    bottom_tr_elements.each(function() {

        if (jQuery(this).hasClass('remaining')) {
            return false;
        }

        var tds = jQuery(this).find('td');
        var cals = parseFloat(tds.eq(calories_i).text());
        var carbs = parseFloat(tds.eq(carbs_i).text());
        var fiber = parseFloat(tds.eq(fiber_i).text());
        var protein = parseFloat(tds.eq(protein_i).text());
        var fat = parseFloat(tds.eq(fat_i).text());

        var pe = (protein / (carbs + fat)).toFixed(2);

        if (!jQuery(this).hasClass('alt')) {
            if (!isNaN(pe)) {
                tds.eq(elem_i).text(pe);
            } else if (jQuery(this).hasClass("total")) {
                tds.eq(elem_i).text("0");
            }
        }

        if (isNaN(cals) ||
            isNaN(carbs) ||
            isNaN(protein) ||
            isNaN(fat) ||
            isNaN(fiber) ||
            isNaN(pe) ||
            cals === 0) {
            meal_idx++;
            return true;
        }

        tds.eq(elem_i).text(pe);

        meal_idx++;
    });
}