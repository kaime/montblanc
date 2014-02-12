describe("Our `browsers.json` file", function() {

  it("should include all caniuse vendors and versions", function() {

    var caniuse = {
          // This is a caniuse-name => montblanc-name lookup table
          vendors: require('./vendors.json'),
          // This is the full caniuse browser support and usage data
          data: require('./data/data.json')
        },
        montblanc = {
          browsers: require('../../src/support/browsers.json')
        };

    caniuse.data.should.have.property('agents');
    caniuse.data.agents.should.be.an.Object;


    // Iterate over all caniuse vendors and versions and check they we know
    // them all
    for (var vendor in caniuse.vendors) {

      // Make sure our lookup table is up to date
      caniuse.vendors.should.have.property(vendor);

      montblanc.browsers.should.have.property(caniuse.vendors[vendor]);

      // @todo Until it makes sense, also test we don't have more vendors or
      // versions than caniuse has

      caniuse.data.agents.should.have.property(vendor);
      caniuse.data.agents[vendor].should.have.property('versions');
      caniuse.data.agents[vendor].versions.should.be.an.Array;

      caniuse.data.agents[vendor].versions.forEach(function(versions) {

        // Ignore `null`. I think they're only there to align caniuse.com tables
        if (versions === null) return;

        // Ignore '0' *for now*. @todo
        if (versions === '0') return;

        // Some caniuse versions are actually version ranges: "opera 9.5-9.6"
        //versions.should.be.a.String.and.match(/((^|-)[0-9]+(\.[0-9]+)?){1,2}$/);
        versions.split('-').forEach(function(version) {
          montblanc.browsers[caniuse.vendors[vendor]].versions.should.have.property(version);
        });
      });
    }

  });

});
