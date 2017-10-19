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

    parent.append("h2").text("Reactions");

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

        return newName && notSpeciesName && notSpeciesSetName && notRateName;
    }


    function drawSpeciesList() {
        speciesListDiv.node().innerHTML = "";

        speciesListDiv.append("h2").text("Species");

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


    function getCRN() {
        return {species: species, speciesSets: speciesSets, rates: rates, constraints: constraints};
    }

    return {getCRN: getCRN}

}  