function crnEditor(opts) {

    var parent;
    if (opts.divName) {
        parent = d3.select('#' + opts.divName);
    } else {
        parent = d3.select('body');
    }

    var species = opts.species ? opts.species : [];
    var speciesListDiv = parent.append('div').attr("id", "speciesListDiv");
    drawSpeciesList();

    var rates = opts.rates ? opts.rates : [];
    var ratesListDiv = parent.append('div').attr("id", "ratesListDiv");
    drawRatesList();

    var constraints = opts.constraints ? opts.constraints : "";
    var constraintsDiv = parent.append('div').attr("id", "constraintsDiv");
    drawConstraintsList();

    var speciesSets = opts.speciesSets ? opts.speciesSets : [];
    var speciesSetsListDiv = parent.append('div').attr("id", "speciesSetsDiv");
    drawSpeciesSetsList();

    var stoichiometries = opts.stoichiometries ? stoichiometries : [];
    var stoichiometriesListDiv = parent.append('div').attr("id", "stoichiometriesDiv");
    drawStoichiometriesList();

    var nodes = [],
        lastNodeId = -1, // first node created will have ID of 1
        links = [];
    var force, svg, drag_line, path, circle;

    var mousedown_link = null,
        mousedown_node = null,
        mouseup_node = null;

    drawReactionGraph();

    // Stuff relating to Constraints list
    function drawConstraintsList() {
        constraintsDiv.node().innerHTML = "";

        ratesListDiv.append("h2").text("Constraints");
        ratesListDiv.append("textarea")
            .node().value = constraints;

    }

    function drawSpeciesSetsList() {

        speciesSetsListDiv.node().innerHTML = "";

        speciesSetsListDiv.append("h2").text("Sets of species");

        speciesSetsListDiv.append("p").text("A set of species can be given as the reactant or product of a reaction, indicating choices. ");

        var speciesSetsListItems = speciesSetsListDiv.append("ul")
            .selectAll("li")
            .data(speciesSets)
            .enter()
            .append("li");

        speciesSetsListItems.append("input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    d.name = this.value;
                }
            });

        speciesSetsListItems.append("i").text("= {");

        speciesSetsListItems.append("input")
            .property("value", function(d){ return d.species.join(", ")})
            .on("change", function(d){

                var included_species = this.value.split(",");
                included_species = included_species.map(function(d){ return d.trim(); });

                var species_names = species.map(function (d){ return d.name; });
                included_species = included_species.filter(function (d){ return species_names.indexOf(d) != -1; });

                d.species = included_species;
                this.value = included_species.join(", ");
            });

        speciesSetsListItems.append("i").text("}");

        speciesSetsListItems.attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'speciesSet'}));
            })
            .on("drop", function () {
            });

        speciesSetsListDiv.append("a")
            .attr("href", "")
            .attr("class", "fa fa-plus")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Name:");
                if (isValidNewName(newName)) {
                    var newspeciesSet = {name: newName, species: []};
                    speciesSets.push(newspeciesSet);
                    drawSpeciesSetsList();
                }
                return false;
            });
    }

    function drawRatesList() {
        ratesListDiv.node().innerHTML = "";

        ratesListDiv.append("h2").text("Rate parameters");

        var ratesListItems = ratesListDiv.append("ul")
            .selectAll("li")
            .data(rates)
            .enter()
            .append("li");

        ratesListItems.append("input")
            .property("value", function(d){ return d.min})
            .on("change", function(d){
                d.min = this.value;
            });

        ratesListItems.append("i").text(" ≤ ");

        ratesListItems.append("input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    d.name = this.value;
                }
            });

        ratesListItems.append("i").text(" ≤ ");

        ratesListItems.append("input")
            .property("value", function(d){ return d.max})
            .on("change", function(d){
                d.max = this.value;
            });

        ratesListItems.append("a")
            .attr("class", "fa  fa-trash")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                if (confirm("Really delete rate " + d.name + "?")){
                    rates.splice(rates.indexOf(d), 1);
                    drawRatesList();
                }
            });

        ratesListItems.attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'reaction'}));
            })
            .on("drop", function () {
            });

        ratesListDiv.append("a")
            .attr("href", "")
            .attr("class", "fa  fa-plus")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Rate parameter name:");
                if (isValidNewName(newName)) {
                    var newRate = {name: newName, min: 1, max: 1};
                    rates.push(newRate);
                    drawRatesList();
                }
                return false;
            });

    }

    function drawStoichiometriesList(){
        stoichiometriesListDiv.node().innerHTML = "";

        stoichiometriesListDiv.append("h2").text("Stoichiometry Variables");

        var stoichiometriesListItems = stoichiometriesListDiv.append("ul")
            .selectAll("li")
            .data(stoichiometries)
            .enter()
            .append("li");

        stoichiometriesListItems.append("input")
            .property("value", function(d){ return d.min})
            .on("change", function(d){
                d.min = this.value;
            });

        stoichiometriesListItems.append("i").text(" ≤ ");

        stoichiometriesListItems.append("input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    d.name = this.value;
                }
            });

        stoichiometriesListItems.append("i").text(" ≤ ");

        stoichiometriesListItems.append("input")
            .property("value", function(d){ return d.max})
            .on("change", function(d){
                d.max = this.value;
            });

        stoichiometriesListItems.append("a")
            .attr("class", "fa  fa-trash")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                if (confirm("Really delete stoichiometry " + d.name + "?")){
                    stoichiometries.splice(stoichiometries.indexOf(d), 1);
                    drawstoichiometriesList();
                }
            });

        stoichiometriesListDiv.append("a")
            .attr("href", "")
            .attr("class", "fa  fa-plus")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Stoichiometry parameter name:");
                if (isValidNewName(newName)) {
                    var newRate = {name: newName, min: 1, max: 1};
                    stoichiometries.push(newRate);
                    drawStoichiometriesList();
                }
                return false;
            });

    }
    
    // Stuff relating to species list
    function isValidNewName(newName) {
        var notSpeciesName = (species.filter(function (s) {
            return s.name === newName
        }).length == 0);
        
        var notSpeciesSetName = (speciesSets.filter(function (s) {
            return s.name === newName
        }).length == 0);
        
        var notRateName = (rates.filter(function (s) {
            return s.name === newName
        }).length == 0);

        var notStoichiometryName = (stoichiometries.filter(function (s) {
            return s.name === newName
        }).length == 0);

        
        return newName && notSpeciesName && notSpeciesSetName && notRateName;
    }


    function drawSpeciesList() {
        speciesListDiv.node().innerHTML = "";

        speciesListDiv.append("h2").text("Species");
        speciesListDiv.append("p").text("Ranges correspond to intial molecule counts.");

        var speciesListItems = speciesListDiv.append("ul")
            .selectAll("li")
            .data(species)
            .enter()
            .append("li");

        speciesListItems.append("input")
            .property("value", function(d){ return d.initial_min})
            .on("change", function(d){
                d.initial_min = this.value;
            });

        speciesListItems.append("i").text( " ≤ ");

        speciesListItems.append("input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    d.name = this.value;
                }
            });

        speciesListItems.append("i").text(" ≤ ");

        speciesListItems.append("input")
            .property("value", function(d){ return d.initial_max})
            .on("change", function(d){
                d.initial_max = this.value;
            });

        var mandatoryField = speciesListItems.append("select")

            .on("change", function(d){
                d.required = this.value;
            });
        mandatoryField.append("option").attr("value", true).text("Mandatory");
        mandatoryField.append("option").attr("value", false).text("Optional");
        mandatoryField.property('value', function(d){return d.required});

        speciesListItems.append("a")
            .attr("class", "fa  fa-trash")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                if (confirm("Really delete species " + d.name + "?")){
                    species.splice(species.indexOf(d), 1);
                    drawSpeciesList();
                }
            });

        speciesListItems.attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'species'}));
            })
            .on("drop", function () {
            });


        var addLink = speciesListDiv.append("a")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Species name:");
                if (isValidNewName(newName)) {
                    var newSpecies = {name: newName, required: true, initial_min: 1, initial_max: 1};
                    species.push(newSpecies);
                    drawSpeciesList();
                }
                return false;
            })
            .append("i").attr("class", "fa fa-plus");

    }

    function drawReactionGraph(){
        parent.append("h2").text("Reactions");

        // initiate network
        var width  = opts.width ? opts.width : 960,
            height = opts.height ? opts.height : 500;

        force = cola.d3adaptor()
            .nodes(nodes)
            .links(links)
            .size([width, height])
            .linkDistance(50)
            .avoidOverlaps(true)
            .on('tick', tick);

        svg = parent
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // define arrow markers for graph links
        svg.append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');

        // line displayed when dragging new nodes
        drag_line = svg.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0');

        path = svg.append('svg:g').selectAll('path');
        circle = svg.append('svg:g').selectAll('g');

        svg
            .on('mousemove', function(){
                if(mousedown_node){
                    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
                }
            })
            .on('mouseup', function(){
                drag_line.classed('hidden', true);
                resetMouseVars();
            })
            .on("dragover", function () {
                d3.event.preventDefault();
            })
            .on("dragenter", function () {
                d3.event.preventDefault();
            })
            .on('drop', function(d){
                var data = JSON.parse(d3.event.dataTransfer.getData("custom-data"));
                nodes.push({id: ++lastNodeId, type: data.type, label: data.name});
                restart();
            })
            .on("contextmenu", function(){
                d3.event.preventDefault();
            });

        restart();
    }


    function tick() {
        // update node positions and links
        path.attr('d', function(d) {
            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourcePadding =  12,
                targetPadding = 17 ,
                sourceX = d.source.x + (sourcePadding * normX),
                sourceY = d.source.y + (sourcePadding * normY),
                targetX = d.target.x - (targetPadding * normX),
                targetY = d.target.y - (targetPadding * normY);
            return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
        });

        circle.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });
    }

    function restart() {
        // path (link) group
        path = path.data(links);
        path.style('marker-end', 'url(#end-arrow)');

        // add new links
        path.enter().append('svg:path')
            .attr('class', 'link')
            .style('marker-end', 'url(#end-arrow)')
            .on('mousedown', function(d) {
                if(d3.event.ctrlKey) return;

                // select link
                mousedown_link = d;
                restart();
            });

        // remove old links
        path.exit().remove();

        // circle (node) group
        // NB: the function arg is crucial here! nodes are known by id, not by index!
        circle = circle.data(nodes, function(d) { return d.id; });

        // add new nodes
        var g = circle.enter().append('svg:g');

         g.append('svg:circle')
            .attr('class', 'node')
            .attr('r', 12)
            .style('stroke', function(d){ return d.type == 'reaction' ? 'black' : 'white' }) // reactions in circle, species not
            .on('mousedown', function(d) {
                mousedown_node = d;
                restart();
            })
            .on('mouseup', function(d) {
                if(!mousedown_node) return;

                drag_line.classed('hidden', true);

                mouseup_node = d;

                var from_reaction = (mousedown_node.type == "reaction");
                var to_reaction = (mouseup_node.type == "reaction");
                var from_species = (["species", "speciesSet"].indexOf(mousedown_node.type) != -1);
                var to_species = (["species", "speciesSet"].indexOf(mouseup_node.type) != -1);

                if (mouseup_node === mousedown_node || (to_reaction && from_reaction) || (to_species && from_species) ) {
                    resetMouseVars();
                } else {
                    links.push({source: mousedown_node.id, target: mouseup_node.id, stoichiometry: '?'});
                    restart();
                }

            });

        g.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'id')
            .style("font-style", function(d){ return d.type == "speciesSet" ? 'italic' : 'normal' })
            .text(function(d) { return d.label; });

        g.filter(function (d) { return d.type == "reaction" })
            .on("contextmenu", d3.contextMenu(getNodeContextMenu));

        circle.style("stroke-dasharray", function(d){ return d.required ? '1,0' : '4,4' }); // optional reactions have dashed, rather than solid, border
        path.style("stroke-dasharray", function(d){
            var notRequired = ((d.source.type == "reaction" && !d.source.required) || (d.target.type == "reaction" && !d.target.required));
            return notRequired ? '4,4' : '1,0';
        });

        path.on("contextmenu", d3.contextMenu(
            function(d){
                return [{
                    title: 'Set stoichiometry',
                    action: function (elm, d) {
                        var stoich = prompt("Stoichiometry ('?', an integer, or a variable name):").trim();

                        // check a stoichiometric variable, or an integer
                        if (parseInt(stoich) || stoich === '?' || stoichiometries.indexOf(stoich) != -1){
                            d.stoichiometry = stoich;
                            restart();
                        }

                    }
                }]
            }
        ));

        // remove old nodes
        circle.exit().remove();

        // set the graph in motion
        force.start();
    }

    function getNodeContextMenu(d){
        return [{
            title: 'Mandatory',
            action: function (elm, d) {
                d.required=true;
                restart();
            },
            disabled: d.required
        }, {
            title: 'Optional',
            action: function (elm, d) {
                d.required=false;
                restart();
            },
            disabled: !d.required
        }]

    }

    function resetMouseVars() {
        mousedown_node = null;
        mouseup_node = null;
        mousedown_link = null;
    }



    function getCRN() {
        return {
            species: species,
            speciesSets: speciesSets,
            rates: rates,
            stoichiometries: stoichiometries,
            constraints: constraints
        };
    }

    return {
        getCRN: getCRN,
        getCRNjson: function () {
            return JSON.stringify(getCRN());
        }
    }

}  