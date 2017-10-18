function crnEditor(opts){

  var parent;
  if (opts.divName){
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


    // Stuff relating to list of species sets
    var selectedSpeciesSetIndex;

    function drawSpeciesSetsList() {

        function openEditspeciesSetsModal(d) {

            nameField.node().value = d.name;

            // set indicator variable for each species
            for (var i = 0; i < species.length; i++) {
                document.getElementById('included_' + species[i].name).value = false;
            }
            for (var i = 0; i < d.species.length; i++) {
                document.getElementById('included_' + d.species[i].name).value = true;
            }

            selectedSpeciesSetIndex = speciesSets.indexOf(d);
            $('#speciesSetParameterModal').modal("show");
        }


        speciesSetsListDiv.node().innerHTML = "";

        speciesSetsListDiv.append("h2").text("Sets of species");

        speciesSetsListDiv.append("p").text("A set of species can be given as the reactant or product of a reaction, indicating choices. ");

        var speciesSetsListItems = speciesSetsListDiv.append("ul")
            .selectAll("li")
            .data(speciesSets)
            .enter()
            .append("li")
            .text(function (d) {
                return d.name + " {" + d.species.join(", ") + "}";
            });

        speciesSetsListItems.append("a")
            .attr("class", "fa  fa-pencil")
            .attr("href", "")
            .attr("onclick", "return false;")
            .on("click", function (d) {
                openEditspeciesSetsModal(d);
            });

        speciesSetsListDiv.append("a")
            .attr("href", "")
            .text("Add a species set")
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

        // Make edit modal
        var oldModal = d3.select("#speciesSetParameterModal");
        if (oldModal.node()) {
            oldModal.node().innerHTML = "";
            oldModal.remove();
        }

        var modal = d3.select("body").append("div").attr("id", "speciesSetParameterModal").attr("class", "modal")
        var modal_content = modal.append("div").attr("class", "modal-content");

        var modal_header = modal_content.append("div").attr("class", "modal-header");
        modal_header.append("button").attr("class", "close").attr("data-dismiss", "modal").text("×");
        modal_header.append("h4").text("Edit speciesSet Parameter");

        var modal_body = modal_content.append("div").attr("class", "modal-body");
        var form = modal_body.append("form").attr("class", ".form-inline");

        var nameField = addFieldAndLabel(form, 'name', 'speciesSet Parameter Name:', 'input');

        // need one select per species
        // TODO: update
        for (var i = 0; i < species.length; i++) {
            var s = species[i];
            var speciesField = addFieldAndLabel(form, 'included_' + s.name, s.name, 'select');

            speciesField.append("option").attr("value", true).text("Included");
            speciesField.append("option").attr("value", false).text("Not included");
        }


        var modal_footer = modal_content.append("div").attr("class", "modal-footer");
        modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").attr("data-dismiss", "modal").text("Close")
        modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").text("Save").on("click", function () {

            var selectedSpeciesSet = speciesSets[selectedSpeciesSetIndex];

            var newName = nameField.node().value;
            if (newName != selectedSpeciesSet.name && isValidNewName(newName)) {
                selectedSpeciesSet.name = newName;
            }

            // save state for each species
            var included_species = [];
            for (var i = 0; i < species.length; i++) {
                var species_name = species[i].name;
                var species_included = document.getElementById('included_' + species_name).value;

                if (species_included == "true") {
                    included_species.push(species_name);
                }
            }
            selectedSpeciesSet.species = included_species;


            $('#speciesSetParameterModal').modal("hide");
            drawSpeciesSetsList();

        })

    }


    
    // Stuff relating to kinetic rates list

    var selectedRateIndex;

    function drawRatesList(){

      function openEditRatesModal(d){
        nameField.node().value = d.name;
        minField.node().value = d.min;
        maxField.node().value = d.max;

        selectedRateIndex = rates.indexOf(d);
        $('#rateParameterModal').modal("show");
      }


    ratesListDiv.node().innerHTML = "";

    ratesListDiv.append("h2").text("Rate parameters");

    var ratesListItems = ratesListDiv.append("ul")
    .selectAll("li")
    .data(rates)
    .enter()
    .append("li")
    .text(function(d){
        return  d.min + " <= " + d.name + " <= " + d.max + " ";
    });

    ratesListItems.append("a")
    .attr("class", "fa  fa-pencil")
    .attr("href", "")
    .attr("onclick", "return false;")
    .on("click", function(d){
        openEditRatesModal(d);
    })

    ratesListDiv.append("a")
    .attr("href", "")
    .text("Add rate parameter")
    .attr("onclick", "return false;")
    .on("click", function(){
        var newName = prompt("Rate parameter name:");
        if (isValidNewName(newName)){
          var newRate = {name: newName, min: 1, max: 1};
          rates.push(newRate);
          drawRatesList();
          // openEditSpeciesModal(newSpecies);
        }
        return false;
    })

    // Make edit modal
    var oldModal = d3.select("#rateParameterModal");
    if (oldModal.node()){
      oldModal.node().innerHTML = "";
      oldModal.remove();
    }

    var modal = d3.select("body").append("div").attr("id", "rateParameterModal").attr("class", "modal")
    var modal_content = modal.append("div").attr("class", "modal-content");

    var modal_header = modal_content.append("div").attr("class", "modal-header");
    modal_header.append("button").attr("class", "close").attr("data-dismiss", "modal").text("×");
    modal_header.append("h4").text("Edit Rate Parameter");

    var modal_body = modal_content.append("div").attr("class", "modal-body");
    var form = modal_body.append("form").attr("class", ".form-inline");

        var nameField = addFieldAndLabel(form, 'name', 'Rate Parameter Name:', 'input');

        var minField = addFieldAndLabel(form, 'initial_min', 'Mnimum value:', 'input');

        var maxField = addFieldAndLabel(form, 'initial_max', 'Maximum value:', 'input');

    var modal_footer = modal_content.append("div").attr("class", "modal-footer");
    modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").attr("data-dismiss", "modal").text("Close")
    modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").text("Save").on("click", function(){ 

        var selectedRateParameter = rates[selectedRateIndex];

        var newName = nameField.node().value;
        if (newName != selectedRateParameter.name && isValidNewName(newName)){
          selectedRateParameter.name = newName;
        }

        var newMin = parseFloat(minField.node().value);
        var newMax = parseFloat(maxField.node().value);

        if (newMin >= 0 && newMax >= newMin){
          selectedRateParameter.min = newMin;
          selectedRateParameter.max = newMax;
        }

        $('#rateParameterModal').modal("hide");
        drawRatesList();

    })

  }





  // Stuff relating to species list
  function isValidNewName(newName){
      var notSpeciesName = (species.filter(function(s){return s.name === newName}).length == 0);
      var notSpeciesSetName = (speciesSets.filter(function(s){return s.name === newName}).length == 0);
      var notRateName = (rates.filter(function(s){return s.name === newName}).length == 0);

      return newName && notSpeciesName && notSpeciesSetName && notRateName;
  }


  var selectedSpeciesIndex;

  function drawSpeciesList(){

    function openEditSpeciesModal(d){
      nameField.node().value = d.name;
      mandatoryField.node().value = d.required;
      initialMinField.node().value = d.initial_min;
      initialMaxField.node().value = d.initial_max;
      selectedSpeciesIndex = species.indexOf(d);
      $('#myModal').modal("show");
    }

    speciesListDiv.node().innerHTML = "";

    speciesListDiv.append("h2").text("Species");

    var speciesListItems = speciesListDiv.append("ul")
    .selectAll("li")
    .data(species)
    .enter()
    .append("li")
    .text(function(d){
      if (d.required){
        return d.name + " (mandatory). Initially " + d.initial_min + " <= " + d.name + " <= " + d.initial_max + " ";
      } else {
        return d.name + " (optional). Initially " + d.initial_min + " <= " + d.name + " <= " + d.initial_max + " ";
      }
      
    });

    speciesListItems.append("a")
    .attr("class", "fa  fa-pencil")
    .attr("href", "")
    .attr("onclick", "return false;")
    .on("click", function(d){
        openEditSpeciesModal(d);
    })

    speciesListDiv.append("a")
    .attr("href", "")
    .text("Add species")
    .attr("onclick", "return false;")
    .on("click", function(){
        var newName = prompt("Species name:");
        if (isValidNewName(newName)){
          var newSpecies = {name: newName, required: true, initial_min: 1, initial_max: 1};
          species.push(newSpecies);
          drawSpeciesList();
          // openEditSpeciesModal(newSpecies);
        }
        return false;
    })

    // Make edit modal
    var oldModal = d3.select("#myModal");
    if (oldModal.node()){
      oldModal.node().innerHTML = "";
      oldModal.remove();
    }

    var modal = d3.select("body").append("div").attr("id", "myModal").attr("class", "modal")
    var modal_content = modal.append("div").attr("class", "modal-content");

    var modal_header = modal_content.append("div").attr("class", "modal-header");
    modal_header.append("button").attr("class", "close").attr("data-dismiss", "modal").text("×");
    modal_header.append("h4").text("Edit Species");

    var modal_body = modal_content.append("div").attr("class", "modal-body");
    var form = modal_body.append("form").attr("class", ".form-inline");

        var nameField = addFieldAndLabel(form, 'name', 'Species Name:', 'input');

        var mandatoryField = addFieldAndLabel(form, 'mandatory', 'Mandatory:', 'select');
        mandatoryField.append("option").attr("value", true).text("Mandatory");
        mandatoryField.append("option").attr("value", false).text("Optional");

        var initialMinField = addFieldAndLabel(form, 'initial_min', 'Initial minimum:', 'input');

        var initialMaxField = addFieldAndLabel(form, 'initial_max', 'Initial maximum:', 'input');

    var modal_footer = modal_content.append("div").attr("class", "modal-footer");
    modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").attr("data-dismiss", "modal").text("Close")
    modal_footer.append("button").attr("type", "button").attr("class", "btn btn-default").text("Save").on("click", function(){ 

        var selectedSpecies = species[selectedSpeciesIndex];

        var newName = nameField.node().value;
        if (newName != selectedSpecies.name && isValidNewName(newName)){
          selectedSpecies.name = newName;
          // TODO: will need to upate reactions too
        }

        selectedSpecies.required = mandatoryField.node().value;

        var newMin = parseFloat(initialMinField.node().value);
        var newMax = parseFloat(initialMaxField.node().value);

        if (newMin >= 0 && newMax >= newMin){
          selectedSpecies.initial_min = newMin;
          selectedSpecies.initial_max = newMax;
        }

        $('#myModal').modal("hide");
        drawSpeciesList();

    })

  }


  function addFieldAndLabel(parentDiv, name, label_text, fieldType){

      var div = parentDiv.append("div")
          .classed("form-group", true);

      div.append("label")
          .classed("control-label", true)
         // .classed("col-sm-5", true)
          .attr("for", name)
          .text(label_text);

      return div.append(fieldType)
          .classed("form-control", true)
         // .classed("col-sm-5", true)
          .attr("name", name)
          .attr("id", name);
  }


  function getCRN(){
    return {species: species, speciesSets: speciesSets, rates: rates, constraints: constraints};
  }


  return {getCRN: getCRN}


}  