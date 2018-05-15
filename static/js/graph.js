queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraph)
    
function makeGraph(error, salaryData){
    let ndx = crossfilter(salaryData)
    
    salaryData.forEach(function (d) {
        d.salary = parseInt((d.salary));
        d.yrs_service = parseInt(d['yrs_service']);
        d.yrs_since_phd = parseInt(d['yrs_since_phd']);
    })
    
    show_select_discipline(ndx);
    show_percent_prof_by_gender(ndx, "Female", "#percent-women-prof");
    show_percent_prof_by_gender(ndx, "Male", "#percent-men-prof");
    show_gender_balance(ndx);
    show_average_salary(ndx);
    show_rank_distribution(ndx);
    show_salary_to_years_of_service(ndx);
    show_phd_to_salary_correlation(ndx);     
            
dc.renderAll();
    
}




function show_select_discipline(ndx) {
    let discipline_dim = ndx.dimension(dc.pluck('discipline'))
    let discipline_group = discipline_dim.group()
    
    dc.selectMenu("#select-discipline")
        .dimension(discipline_dim)
        .group(discipline_group)
}

function show_percent_prof_by_gender(ndx, gender, element) {
      let all_records = ndx.groupAll();
    
      let matches_that_are_professors = all_records.reduce(
        function (p, v) {
            if (v.sex == gender) {
                p.total_found += 1;
                if (v.rank == "Prof") {
                    p.are_prof += 1;
                }
                p.percent = (p.are_prof / p.total_found);  
            }
            return p;
        },
        function (p, v) {
            if (v.sex == gender) {
                p.total_found -= 1;
                if(p.total_found > 0) {                
                    if (v.rank == "Prof") {
                        p.are_prof -= 1;
                    }
                    p.percent = (p.are_prof / p.total_found);
                } else {
                    p.are_prof = 0;
                    p.percent = 0;
                }
            }
            return p;
        },
        
        function () {
            return { total_found: 0, are_prof: 0, percent: 0 };
            
        });
        dc.numberDisplay(element)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            return d.percent;
        })
        .group(matches_that_are_professors);
        
    
}

function show_gender_balance(ndx) {
    let gender_dim = ndx.dimension(dc.pluck('sex'))
    let count_by_gender = gender_dim.group().reduceCount();
    
    dc.barChart("#gender-balance")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(gender_dim)
        .group(count_by_gender)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
}

function show_average_salary(ndx) {
   let gender_dim = ndx.dimension(dc.pluck('sex'));
   let salary_by_gender = gender_dim.group().reduce(
        function (p, v) {
            p.count ++;
            p.total += v.salary;
            p.average = p.total / p.count;
            console.log(p.average)
            return p;
        },
        function (p, v){
            p.count --;
            if (p.count > 0) {
                p.total -= v.salary;
                p.average = p.total / p.count;
            } else {
                p.total = 0;
                p.average = 0;
            }
            return p;
        },
        function () {
            return {count: 0, total: 0, average: 0 }
        });
    
    
    // p is the init object (accumulater).
    // v is each row of data.

    dc.barChart("#average-salary")
        .width(500)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(gender_dim)
        .group(salary_by_gender)
        .valueAccessor(function(p){
            return p.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Person")
        .yAxis().ticks(4);
}

function show_salary_to_years_of_service(ndx) {
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["red", "green"]);

    
    var experienceDim = ndx.dimension(function(d){
        return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();

    var eDim = ndx.dimension(dc.pluck("yrs_service"));
    var minExperience = eDim.bottom(1)[0].yrs_service;
    var maxExperience = eDim.top(1)[0].yrs_service;

    dc.scatterPlot("#salary-to-years-of-service")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience,maxExperience]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Of Service")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
        
}
function show_phd_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["red", "green"]);

    
    var experienceDim = ndx.dimension(function(d){
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();

    var eDim = ndx.dimension(dc.pluck("yrs_since_phd"));
    var minExperience = eDim.bottom(1)[0].yrs_since_phd;
    var maxExperience = eDim.top(1)[0].yrs_since_phd;

    dc.scatterPlot("#salary-to-years-since-phd")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience,maxExperience]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years since PHd")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
        
}
function show_rank_distribution(ndx) {
    let gender_dim = ndx.dimension(dc.pluck('sex'))
    
     let percent_prof_by_gender = get_percent_rank_by_gender(ndx, "Prof");    
     let percent_assoc_by_gender = get_percent_rank_by_gender(ndx, "AssocProf");
     let percent_asst_by_gender = get_percent_rank_by_gender(ndx, "AsstProf");
     
     
     dc.barChart("#rank-distribution")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(gender_dim)
        .group(percent_prof_by_gender)
        .stack(percent_assoc_by_gender)
        .stack(percent_asst_by_gender)
        .transitionDuration(500)
        .valueAccessor( function(d) {
            return d.value.percent;
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().tickFormat(d3.format(".0%"));
    
}

function get_percent_rank_by_gender(ndx, rank) {
    let gender_dim = ndx.dimension(dc.pluck('sex'))
    return gender_dim.group().reduce(
            function (p, v) {
               
                    p.total_found += 1;
                    if (v.rank == rank) {
                        p.are_prof += 1;
                    }
                    p.percent = (p.are_prof / p.total_found);  
                
                return p;
            },
            function (p, v) {
                
                    p.total_found -= 1;
                    if(p.total_found > 0) {                
                        if (v.rank == rank) {
                            p.are_prof -= 1;
                        }
                        p.percent = (p.are_prof / p.total_found);
                    } else {
                        p.are_prof = 0;
                        p.percent = 0;
                    }
                
                return p;
            },
            
            function () {
                return { total_found: 0, are_prof: 0, percent: 0 };
                
            });
}