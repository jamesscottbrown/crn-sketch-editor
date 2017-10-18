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

  parent.append("h2").text("Reactions");
  




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
    return newName && (species.filter(function(s){return s.name === newName}).length == 0);
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




}  