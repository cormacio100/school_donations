/**
 * Created by Cormac Liston on 23/03/2017.
 */

/**
 * JAVASCRIPT LIBRARIES IN USE:
 *  -   D3.JS   -   Used to build axes and shapes from data using scales
 *              -   It can build STATIC graphs but here it is used to SCALE the data
 *  -   DC.js   -   Uses D3.js objects to build pre-defined charts to make the graphs interactive
 *              -   It builds the graphs from the data
 *  -   CROSSFILTER.js  -   used to slice/dice arrays in order to filter the data allowing DC.js to refresh the charts with the filtered data
 *                      -   It organises the data behind the graphs
 *                      -   It does not build the graphs
 *  -   Queue.js    -   Allows you to queue data from APIs
 */

//  read from data hosted at the API with asynchronous loading and saves it to the apiData variable
queue()
    .defer(d3.json,'/donorsUS/projects')    //  talk to API AT location /donorUS/projects
    .await(makeGraphs);                     //  pass the DATA to the makeGraphs function

//  transform data (projectsJson) using D3.js
//  Data gets parsed in to format that the charts can use
function makeGraphs(error,projectsJson){
    //  Clean projectsJson data
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%d/%m/%Y %H:%M");    //  determine date format
    //  Parse the DATA into correct format
    donorsUSProjects.forEach(function(d){
        d.date_posted = dateFormat.parse(d.date_posted);

        if (d.date_posted != null){
            d.date_posted.setDate(1);
        }
        d.total_definitions = +d.total_donations;  //  + sets data type of total_donations to a number
    });

//  Use CROSSFILTER.js to create a CROSSFILTER instance from the DATA
//  so that DATA is INDEXED and can be filtered
//  -   Crossfilter 2 way binding pipeline allows:
//      -   Data selections on each chart to be auto applied to other charts
//      -   Drill down functionality enabled

////////////////////////////////////////////////////////
//  CROSSFILTER.JS SECTION
//  DATA IS INDEXED/GROUPED

    //#######################################################
    //  1 - index the data
    var ndx = crossfilter(donorsUSProjects);
    //#######################################################

    //#######################################################
    //  2 - Define Dimensions on the Crossfiltered data
    //  On date_posted
    var dateDim = ndx.dimension(function(d){
        return d.date_posted;
    });
    //  on resource type
    var resourceTypeDim = ndx.dimension(function(d){
        //return d["resource_type"];
        return d.resource_type;
    });
    //  on poverty level
    var povertyLevelDim = ndx.dimension(function(d){
        //return d["poverty_level"];
        return d.poverty_level;
    });
    // on school state
    var stateDim = ndx.dimension(function(d){
        //return d["school_state"];
        return d.school_state;
    });
    //  on total donations
    var totalDonationsDim = ndx.dimension(function(d){
       //return d["total_donations"];
       return d.total_donations;
    });
    //  on funding status
    var fundingStatus = ndx.dimension(function(d){
       //return d["funding_status"];
       return d.funding_status;
    });
    //#######################################################

    //#######################################################
    //  3 - GROUP THE DATA DEPENDING ON THE DIMENSION
    //  IN ORDER TO CALCULATE THE METRICS
    //  IN THIS PROJECT - THERE IS ONE CHART FOR GROUP
    //  E.G. Grouping on fundingStatus will give us group totals
    //  for each type of funding status
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByFundingStatus = fundingStatus.group();
    //  Group by state and show total Donations for each
    var totDonationsByState = stateDim.group().reduceSum(function(d){
       //return d["total_donations"];
        return d.total_donations;
    });
    var stateGroup = stateDim.group();

    //#######################################################
    //  4 - get totals
    var all = ndx.groupAll();
    //  get a total for all donations
    //  this will produce a list by state
    var totalDonations = all.reduceSum(function(d){
       //return d["total_donations"];
       // console.log('total_donations');
       // console.log(d.total_donations);
        return d.total_donations;
    });

    //  retrieve which state donated the most
    // var max_state = totalDonations.top(1)[0].value;

    //  Define values to be used in charts
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];


//  DATA HAS BEEN MANIPULATED
//  END CROSSFILTER.JS SECTION
////////////////////////////////////////////////////////
//  DC.JS SECTION
//  DEFINING THE CHARTS

    //  DEFINE CHART TYPES AND BIND THEM TO THE DIV ID'S IN INDEX.HTML
    //  DETERMINE WHERE IN DOM EACH CHART WILL APPEAR
    //  AND WHAT TYPE OF CHART WILL APPEAR THERE
    var timeChart = dc.barChart('#time-chart');                         //  NUMBER OF DONATIONS
    var povertyLevelChart = dc.rowChart('#poverty-level-row-chart');    //  POVERTY LEVEL
    var resourceTypeChart = dc.rowChart('#resource-type-row-chart');    //  RESOURCES TYPE
    var fundingStatusChart = dc.pieChart('#funding-chart');             //  FUNDING STATUS
    var numberProjectsND = dc.numberDisplay('#number-projects-nd');     //  TOTAL NUMBER OF DONATIONS
    var totalDonationsND = dc.numberDisplay('#total-donations-nd');     //  TOTAL DONATIONS IN USD

    //  ###########################################
    //  BUILD THE CHARTS
    //  ASSIGN PROPERTIES AND VALUES TO OUR CHARTS
    //  ###########################################

    //  Barchart
    timeChart
        .width(800)
        .height(200)
        .margins({top:10,right:50,bottom: 30,left:50})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate,maxDate]))
        .elasticY(true)
        .xAxisLabel('Year')
        .yAxis().ticks(4);

    //  Row Chart
    povertyLevelChart
        .width(300)
        .height(250)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .xAxis().ticks(4);

    //  Row Chart
    resourceTypeChart
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)         //  tell the chart what dimension to use
        .group(numProjectsByResourceType)   //  tell the chart what group to use
        .xAxis().ticks(4);

    //  Pie Chart
    fundingStatusChart
        .height(220)
        .radius(90)
        .innerRadius(40)
        .transitionDuration(1500)
        .dimension(fundingStatus)
        .group(numProjectsByFundingStatus);

    //  build the SELECT MENU
    selectField = dc.selectMenu('#menu-select')
                    .dimension(stateDim)
                    .group(stateGroup);

    //  FORMAT Numbers to be displayed in numberDisplay
    numberProjectsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function(d){
            return d;
        })
        .group(all);

    //  FORMAT Numbers to be displayed in numberDisplay
    totalDonationsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function(d){
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format(".3s"));

    //  RENDER THE CHARTS
    dc.renderAll();
}