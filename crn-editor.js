function crnEditor(opts) {

    var parent;
    if (opts.divName) {
        parent = d3.select('#' + opts.divName);
    } else {
        parent = d3.select('body');
    }
    var headerLevel = opts.headerLevel ? opts.headerLevel : 1;
    var updateSpeciesCallback = opts.updateSpeciesCallback ? opts.updateSpeciesCallback : function(){};
    var updateInputCallback = opts.updateInputCallback ? opts.updateInputCallback : function(){};

    var edgeOffset = 20;

    var inputs, species, rates, speciesVariables, stoichiometries, constraints, nodes, links, lastNodeId;

    var inputListDiv = parent.append('div').attr("id", "speciesListDiv");
    var speciesListDiv = parent.append('div').attr("id", "speciesListDiv");
    var ratesListDiv = parent.append('div').attr("id", "ratesListDiv");
    var speciesVariablesListDiv = parent.append('div').attr("id", "speciesVariablesDiv");
    var stoichiometriesListDiv = parent.append('div').attr("id", "stoichiometriesDiv");
    var constraintsDiv = parent.append('div').attr("id", "constraintsDiv");
    var crnDiagramDiv = parent.append('div').attr("id", "crnDiagramDiv");

    var force, svg, drag_line, path, linkLabels, circle;

    var mousedown_link = null,
        mousedown_node = null,
        mouseup_node = null;

    setCRN(opts);

    function setCRN(opts){
        if (typeof opts === 'string'){
            opts = JSON.parse(opts);

            // fix links
            var nodeIndex = [];
            for (var i=0; i<opts.nodes.length; i++){
                nodeIndex[ opts.nodes[i].id ] = i;
            }

            for (i=0; i<opts.links.length; i++){
                var link = opts.links[i];
                var sourceNode = opts.nodes[nodeIndex[link.source_id]];
                var targetNode = opts.nodes[nodeIndex[link.target_id]];

                opts.links[i] = {source: sourceNode, target: targetNode, stoichiometry: link.stoichiometry };
                console.log(opts.links[i])
            }
        }

        var allowInputs = opts.allowInputs ? opts.allowInputs : true;
        inputs = opts.inputs ? opts.inputs : [];
        species = opts.species ? opts.species : [];
        rates = opts.rates ? opts.rates : [];
        speciesVariables = opts.speciesVariables ? opts.speciesVariables : [];
        stoichiometries = opts.stoichiometries ? opts.stoichiometries : [];
        constraints = opts.constraints ? opts.constraints : "";
        nodes = opts.nodes ? opts.nodes : [];
        links = opts.links ? opts.links : [];

        lastNodeId = -1; // first node created will have ID of 0
        for (var i=0; i<nodes.length; i++){
            lastNodeId = Math.max(lastNodeId, nodes[i].id);
        }

        if (allowInputs){
            drawInputList();
        }

        drawSpeciesList();
        drawRatesList();
        drawSpeciesVariablesList();
        drawStoichiometriesList();
        drawConstraintsList();

        drawReactionGraph();
    }



    // Stuff relating to Constraints list
    function drawConstraintsList() {
        constraintsDiv.node().innerHTML = "";

        constraintsDiv.append("h" + (headerLevel+1)).text("Constraints");
        constraintsDiv.append("textarea")
            .node().value = constraints;

    }

    function drawSpeciesVariablesList() {

        speciesVariablesListDiv.node().innerHTML = "";

        speciesVariablesListDiv.append("h" + (headerLevel+1)).text("Species variables");

        speciesVariablesListDiv.append("p").text("A species variable can appear as a reactant or product in a reaction. ");

        var speciesVariablesListItems = speciesVariablesListDiv.append("ul")
            .selectAll("li")
            .data(speciesVariables)
            .enter()
            .append("li")
            .attr("class", "param-li");

        speciesVariablesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    renameNode(d.name, this.value);
                    d.name = this.value;
                }
            })
            // Make draggable
            .attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'speciesVariable'}));
            })
            .on("drop", function () {
            });

        speciesVariablesListItems.append("i").text("∈ {");

        speciesVariablesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.species.join(", ")})
            .on("change", function(d){

                var included_species = this.value.split(",");
                included_species = included_species.map(function(d){ return d.trim(); });

                var species_names = species.map(function (d){ return d.name; });
                included_species = included_species.filter(function (d){ return species_names.indexOf(d) != -1; });

                d.species = included_species;
                this.value = included_species.join(", ");
            });

        speciesVariablesListItems.append("i").text("}");

        speciesVariablesListItems.append("a")
            .attr("class", "fa  fa-trash")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                if (confirm("Really delete species set " + d.name + "?")){
                    speciesVariables.splice(speciesVariables.indexOf(d), 1);
                    removeNode(d.name);
                    drawSpeciesVariablesList();
                }
            });

        speciesVariablesListDiv.append("a")
            .attr("href", "")
            .attr("class", "fa fa-plus")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Name:");
                if (isValidNewName(newName)) {
                    var newspeciesVariable = {name: newName, species: []};
                    speciesVariables.push(newspeciesVariable);
                    drawSpeciesVariablesList();
                }
                return false;
            });

        updateSpeciesCallback(species, speciesVariables);
    }

    function drawRatesList() {
        ratesListDiv.node().innerHTML = "";

        ratesListDiv.append("h" + (headerLevel+1)).text("Rate parameters");

        var ratesListItems = ratesListDiv.append("ul")
            .selectAll("li")
            .data(rates)
            .enter()
            .append("li")
            .attr("class", "param-li");

        ratesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.min})
            .on("change", function(d){
                d.min = this.value;
            });

        ratesListItems.append("i").text(" ≤ ");

        ratesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    renameNode(d.name, this.value);
                    d.name = this.value;
                }
            })
            // Make draggable
            .attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'reaction'}));
            })
            .on("drop", function () {
            });

        ratesListItems.append("i").text(" ≤ ");

        ratesListItems.append("input")
            .attr("class",  "parameter-input")
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
                    removeNode(d.name);
                    drawRatesList();
                }
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

        stoichiometriesListDiv.append("h" + (headerLevel+1)).text("Stoichiometry Variables");

        var stoichiometriesListItems = stoichiometriesListDiv.append("ul")
            .selectAll("li")
            .data(stoichiometries)
            .enter()
            .append("li")
            .attr("class", "param-li");

        stoichiometriesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.min})
            .on("change", function(d){
                d.min = this.value;
            });

        stoichiometriesListItems.append("i").text(" ≤ ");

        stoichiometriesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    renameNode(d.name, this.value);
                    d.name = this.value;
                }
            });

        stoichiometriesListItems.append("i").text(" ≤ ");

        stoichiometriesListItems.append("input")
            .attr("class",  "parameter-input")
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
                    removeNode(d.name);
                    drawStoichiometriesList();
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
        var notInputName = (inputs.filter(function (s) {
            return s.name === newName
        }).length == 0);

        var notSpeciesName = (species.filter(function (s) {
            return s.name === newName
        }).length == 0);
        
        var notSpeciesVariableName = (speciesVariables.filter(function (s) {
            return s.name === newName
        }).length == 0);
        
        var notRateName = (rates.filter(function (s) {
            return s.name === newName
        }).length == 0);

        var notStoichiometryName = (stoichiometries.filter(function (s) {
            return s.name === newName
        }).length == 0);

        
        return newName && notInputName && notSpeciesName && notSpeciesVariableName && notRateName && notStoichiometryName;
    }


    function drawInputList() {
        inputListDiv.node().innerHTML = "";

        inputListDiv.append("h" + (headerLevel+1)).text("Inputs");
        inputListDiv.append("p").text("Inputs are species whose concentration is given as a function of time.");

        var inputListItems = inputListDiv.append("ul")
            .selectAll("li")
            .data(inputs)
            .enter()
            .append("li")
            .attr("class", "param-li");

        inputListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    renameNode(d.name, this.value);
                    d.name = this.value;
                }
            })
            // Make draggable
            .attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'input'}));
            })
            .on("drop", function () {
            });


        inputListItems.append("a")
            .attr("class", "fa  fa-trash")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                if (confirm("Really delete input " + d.name + "?")){
                    inputs.splice(inputs.indexOf(d), 1);
                    removeNode(d.name);
                    drawInputList();
                }
            });

        inputListDiv.append("a")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function () {
                var newName = prompt("Input name:");
                if (isValidNewName(newName)) {
                    var newinput = {name: newName};
                    inputs.push(newinput);
                    drawInputList();
                }
                return false;
            })
            .append("i").attr("class", "fa fa-plus");

        updateInputCallback(inputs);
    }


    function drawSpeciesList() {
        speciesListDiv.node().innerHTML = "";

        speciesListDiv.append("h" + (headerLevel+1)).text("Species");
        speciesListDiv.append("p").text("Ranges correspond to intial molecule counts.");

        var speciesListItems = speciesListDiv.append("ul")
            .selectAll("li")
            .data(species)
            .enter()
            .append("li")
            .attr("class", "param-li");

        speciesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.initial_min})
            .on("change", function(d){
                d.initial_min = this.value;
            });

        speciesListItems.append("i").text( " ≤ ");

        speciesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.name})
            .on("change", function(d){
                if (isValidNewName(this.value)){
                    renameNode(d.name, this.value);
                    d.name = this.value;
                }
            })
            // Make draggable
            .attr("draggable", true)
            .on("dragstart", function (d) {
                var ev = d3.event;
                ev.dataTransfer.setData("custom-data", JSON.stringify({name: d.name, type: 'species'}));
            })
            .on("drop", function () {
            });

        speciesListItems.append("i").text(" ≤ ");

        speciesListItems.append("input")
            .attr("class",  "parameter-input")
            .property("value", function(d){ return d.initial_max})
            .on("change", function(d){
                d.initial_max = this.value;
            });

        var mandatoryField = speciesListItems.append("select")
            .style("margin-left", "10px")
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
                    removeNode(d.name);
                    drawSpeciesList();
                }
            });

        speciesListDiv.append("a")
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

        updateSpeciesCallback(species, speciesVariables);
    }

    function drawReactionGraph(){
        crnDiagramDiv.node().innerHTML = "";
        crnDiagramDiv.append("h" + (headerLevel+1)).text("Reactions");

        // initiate network
        var width  = opts.width ? opts.width : 960,
            height = opts.height ? opts.height : 500;

        force = cola.d3adaptor()
            .nodes(nodes)
            .links(links)
            .size([width, height])
            .linkDistance(100)
            .flowLayout('x', 100)
            .avoidOverlaps(true)
            .on('tick', tick);

        svg = crnDiagramDiv
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        crnDiagramDiv.append("p")
            .text("Drag and drop species or species variables, or rate parameters to add a reaction. Drag from a reactant to a rate constant, or from a rate constant to a product.");

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
        linkLabels = svg.append('svg:g').selectAll('text');

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
            .on('drop', function(){
                var data = JSON.parse(d3.event.dataTransfer.getData("custom-data"));
                nodes.push({id: ++lastNodeId, type: data.type, label: data.name});
                force.nodes(nodes);
                restart();
            })
            .on("contextmenu", function(){
                d3.event.preventDefault();
            });

        crnDiagramDiv.append("button")
            .on("click", mergeDuplicatedSpecies)
            .text("Merge species");

        crnDiagramDiv.append("button")
            .on("click", splitDuplicatedSpecies)
            .text("Split species");

        crnDiagramDiv.append("button")
            .on("click", function(){
                nodes = [];
                links = [];
                force.nodes(nodes).links(links);
                restart();
            })
            .attr("id", "clear-button")
            .text("Clear");

        restart();
    }


    function tick() {

        // update node positions and links
        path.attr('d', function(d) {
                var p = getArrowPos(d);

                // Path command: M moves to 'source' position, then Q draws a Quadratic Bezier curve to 'target' position via control point
                return 'M' + p.sourceX + ',' + p.sourceY + 'Q' + p.controlX + "," + p.controlY + "," + p.targetX + ',' + p.targetY;
        });

        linkLabels.attr("x", function(d){
            return getArrowPos(d).controlX;
        }).attr("y", function(d){
            var p = getArrowPos(d);

            if (p.offset > 0){
                // if arrow was bent downwards, shift text down so top of text beneath it
                return p.controlY  + this.getBBox().height;
            } else {
                return p.controlY;
            }
        });

        circle.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });

        function getArrowPos(d){
            var sourcePadding =  12,
                targetPadding = 17;

            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                normX = deltaX / dist,
                normY = deltaY / dist,
                sourceX = d.source.x + (sourcePadding * normX),
                sourceY = d.source.y + (sourcePadding * normY),
                targetX = d.target.x - (targetPadding * normX),
                targetY = d.target.y - (targetPadding * normY);

            var controlX = (sourceX + targetX) / 2,
                offset = (d.target.type == "reaction") ? +edgeOffset : -edgeOffset,
                controlY = (sourceY + targetY) / 2 + offset;

            return {sourceX: sourceX, sourceY: sourceY, targetX: targetX, targetY: targetY, controlX: controlX, controlY: controlY, offset: offset};
        }

    }

    function restart() {
        // path (link) group
        path = path.data(links);
        path.style('marker-end', 'url(#end-arrow)');

        // add new links
        path.enter().append('svg:path')
            .attr('class', 'link')
            .on('mousedown', function(d) {
                if(d3.event.ctrlKey) return;

                // select link
                mousedown_link = d;
                restart();
            });

        // remove old links
        path.exit().remove();

        // Link labels
        linkLabels = linkLabels.data(links);
        linkLabels.enter()
            .append('text');

        linkLabels.exit().remove();
        linkLabels.text(function(d){ return d.stoichiometry; });

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
                var from_species = (["species", "speciesVariable"].indexOf(mousedown_node.type) != -1);
                var to_species = (["species", "speciesVariable"].indexOf(mouseup_node.type) != -1);


                var validNodePair = (from_reaction && to_species)
                    || (mousedown_node.type == "or-product" && to_species)
                    || (from_species && to_reaction)
                    || (from_species && mouseup_node.type == "or-reactant");

                if (mouseup_node === mousedown_node || !validNodePair) {
                    resetMouseVars();
                } else {
                    links.push({source: mousedown_node, target: mouseup_node, stoichiometry: '?'});
                    force.links(links);
                    restart();
                }

            });

        g.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'id')
            .style("font-style", function(d){ return d.type == "speciesVariable" ? 'italic' : 'normal' })
            .text(function(d) { return d.label; });

        g.filter(function (d) { return d.type == "reaction" })
            .on("contextmenu", d3.contextMenu(getReactantNodeContextMenu));

        g.filter(function (d) { return d.type == "or-reactant" || d.type == "or-product" })
            .on("contextmenu", d3.contextMenu(getChoiceNodeContextMenu));


        circle.style("stroke-dasharray", function(d){ return d.required ? '1,0' : '4,4' }); // optional reactions have dashed, rather than solid, border

        path.style("stroke-dasharray", function(d){
            var notRequired = ((d.source.type == "reaction" && !d.source.required) || (d.target.type == "reaction" && !d.target.required));

            var choice = (d.source.type == "or-product" || d.target.type == "or-reactant") ;
            return (notRequired || choice) ? '4,4' : '1,0';
        }).style('marker-end', function(d){
                return (d.target.type == "or-product" || d.target.type == "or-reactant") ? '' : 'url(#end-arrow)';
            });

        path.on("contextmenu", d3.contextMenu(getEdgeContextMenu));

        // remove old nodes
        circle.exit().remove();

        // set the graph in motion
        force.start();
    }

    function getEdgeContextMenu(d) {
        var options = [{
            title: 'Set stoichiometry',
            action: function (elm, d) {
                var stoich = prompt("Stoichiometry ('?', an integer, or a variable name):").trim();

                // check a stoichiometric variable, or an integer
                var stoichNames = stoichiometries.map(function (d) {
                    return d.name;
                });
                if (parseInt(stoich) || stoich === '?' || stoichNames.indexOf(stoich) != -1) {
                    d.stoichiometry = stoich;
                    restart();
                }

            }
        }, {
            title: 'Delete edge',
            action: function (elm, d) {
                links.splice(links.indexOf(d), 1);
                force.links(links);
                restart();
            }
        }];

        if (d.source.type == "reaction" && (d.target.type == "species" || d.target.type == "speciesVariable")){
            options.push({
                title: 'Add alternative product',
                action: function (elm, d) {
                    addAlternative(d, 'product');
                }
            });
        }

        if (d.target.type == "reaction" && (d.source.type == "species" || d.source.type == "speciesVariable")){
            options.push({
                title: 'Add alternative reactant',
                action: function (elm, d) {
                    addAlternative(d, 'reactant');
                }
            });
        }

        return options;
    }

    function addAlternative(d, role){
        // add new plus type
        var orNode = {id: ++lastNodeId, label: "or", type: "or-" + role};
        nodes.push(orNode);

        // change this edge to point at the plus node
        var oldTarget = d.target;
        d.target = orNode;

        var stoichFromOrNode;
        if (role == 'product'){
            stoichFromOrNode = d.stoichiometry;
            d.stoichiometry = '';
        } else {
            stoichFromOrNode = '';
        }


        // add link from plus node to old target of this edge
        links.push({source: orNode, target: oldTarget, stoichiometry: stoichFromOrNode});

        force.nodes(nodes).links(links);
        restart();
    }

    function getReactantNodeContextMenu(d){
        return [{
            title: 'Mandatory',
            action: function (elm, d) {
                var node = nodes.filter(function (n){ return n.id == d.id})[0];
                node.required=true;
                restart();
            },
            disabled: d.required
        }, {
            title: 'Optional',
            action: function (elm, d) {
                var node = nodes.filter(function (n){ return n.id == d.id})[0];
                node.required=false;
                restart();
            },
            disabled: !d.required
        }, {
            title: 'Delete',
            action: function (elm, d) {
                var id = d.id;
                nodes = nodes.filter(function (n){ return n.id != id});
                links = links.filter(function (l){ return l.source.id != id && l.target.id != id});
                force.nodes(nodes).links(links);
                restart();
            }
        }]

    }

    function getChoiceNodeContextMenu(){
        return [{
            title: 'Delete',
            action: function (elm, d) {
                var id = d.id;
                nodes = nodes.filter(function (n){ return n.id != id});
                links = links.filter(function (l){ return l.source.id != id && l.target.id != id});
                force.nodes(nodes).links(links);
                restart();
            }
        }]

    }

    function renameNode(oldName, newName){
        for (var i =0; i<nodes.length; i++){
            if (nodes[i].label == oldName){
                nodes.label = newName;
            }
        }
        restart();
    }
    
    function removeNode(nodeName){
        links = links.filter(function (l){ return (l.source.label != nodeName) && (l.target.label != nodeName); });
        nodes = nodes.filter(function(n){ return n.label != nodeName });
        force.links(links).nodes(nodes);
        restart();
    }
    

    function resetMouseVars() {
        mousedown_node = null;
        mouseup_node = null;
        mousedown_link = null;
    }

    function mergeDuplicatedSpecies(){
        var speciesNames = [];
        var firstSpeciesWithName = [];

        for (var i=0; i<nodes.length; i++){

            if (nodes[i].type != "species" && nodes[i].type != "speciesVariable"){ continue; }

            var l = nodes[i].label;

            if (speciesNames.indexOf(l) == -1) {
                // new species
                speciesNames.push(l);
                firstSpeciesWithName[l] = nodes[i];

            } else {
                // species encountered before

                for (var j=0; j<links.length; j++){

                    if (links[j].source == nodes[i]){
                        links[j].source = firstSpeciesWithName[l];
                    }
                    if (links[j].target == nodes[i]){
                        links[j].target = firstSpeciesWithName[l];
                    }


                }
                nodes.splice(i, 1);
                i--;
            }
        }

        force.nodes(nodes).links(links);
        restart();
    }

    function splitDuplicatedSpecies(){

        for (var i=0; i<nodes.length; i++){
            // skip node unless it is a reaction

            var reaction = nodes[i];
            if (reaction.type != "reaction"){ continue; }

            // find all species that participate in reaction
            var participants = [];
            var inAnotherReaction = [];

            for (var j=0; j<links.length; j++){
                var source = links[j].source;
                var target = links[j].target;
                if (target == reaction && participants.indexOf(source) == -1){
                    participants.push(source);
                }
                if (source == reaction && participants.indexOf(target) == -1){
                    participants.push(target);
                }

                if (target != reaction && inAnotherReaction.indexOf(source) == -1 && (source.type == "species" || source.type == "speciesVariable")){
                    inAnotherReaction.push(source);
                }
                if (source != reaction && inAnotherReaction.indexOf(target) == -1 && (target.type == "species" || target.type == "speciesVariable")){
                    inAnotherReaction.push(target);
                }
            }


            // if species participates in another reaction then duplicate it
            for (j=0; j<participants.length; j++){
                var s = participants[j];

                if (inAnotherReaction.indexOf(s) != -1){
                    var newNode = {id: ++lastNodeId, type: s.type, label: s.label};
                    nodes.push(newNode);

                    for (var k=0; k<links.length; k++){
                        if (links[k].source == reaction && links[k].target == s){
                            links[k].target = newNode;
                        }
                        if (links[k].target == reaction && links[k].source == s){
                            links[k].source = newNode;
                        }
                    }
                }
            }
        }

        force.nodes(nodes).links(links);
        restart();
    }

    function disableEditing(){
        parent.selectAll(".fa-plus").remove();
        parent.selectAll(".fa-trash").remove();

        parent.selectAll("#clear-button").remove();

        parent.selectAll("select").attr("disabled", true); // select elements have no readonly attribute

        parent.selectAll("textarea").attr("readonly", true);

        parent.selectAll("input").attr("readonly", true);
        parent.selectAll("input").attr("draggable", false);
    }

    function getCRN() {
        // note that we cannot serialise {nodes: nodes, links: links} because of cyclic references
        var node_list = [];
        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var converted_node = {
                id: node.id,
                type: node.type,
                x: node.x,
                y: node.y,
                label: node.label
            };

            if (node.type == "reaction"){
                converted_node.required = node.required;
            }
            node_list.push(converted_node);
        }

        var link_list = [];
        for (i = 0; i < links.length; i++) {
            var link = links[i];
            link_list.push({source_id: link.source.id, target_id: link.target.id, stoichiometry: link.stoichiometry});
        }

        return {
            species: species,
            speciesVariables: speciesVariables,
            rates: rates,
            stoichiometries: stoichiometries,
            constraints: constraints,
            nodes: node_list,
            links: link_list
        };
    }

    return {
        setCRN: setCRN,
        getCRN: getCRN,
        getCRNjson: function () {
            return JSON.stringify(getCRN());
        },
        mergeReactions: mergeDuplicatedSpecies,
        splitDuplicatedSpecies: splitDuplicatedSpecies,
        disableEditing: disableEditing
    }

}  
