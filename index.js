module.exports = (robot) => {
  console.log( 'Welcome to Probot semver' );

  robot.on( 'release.published', async context => {
    var release = context.payload.release;
    var github = context.github;

    console.log( release.author.login + ' released ' + release.tag_name + '!' );

    // probot semver expects a semver string to be present in the tag, with an optional prefix
    var matches = release.tag_name.match( /[0-9]+\.[0-9]+\.[0-9]+$/ );

    if ( ! matches ) {
      console.log('Could not detect a semver :(');
      return;
    }
    var ver = matches[0];
    var major, minor, patch, owner, repo;

    [major,minor,patch] = ver.split( '.' );
    [owner,repo] = context.payload.repository.full_name.split( '/' );

    var next_major = ( parseInt( major, 10 ) + 1 ) + '.0.0';
    var next_minor = major + '.' + ( parseInt( minor, 10 ) + 1 ) + '.0';
    var next_patch = major + '.' + minor + '.' + ( parseInt( patch, 10 ) + 1 );

    github.issues.getMilestones( {
      'owner' : owner,
      'repo'  : repo,
      'state' : 'open',
    }, function( error, result ) {
      var create_major = true;
      var create_minor = true;
      var create_patch = true;
      var ver_ms = null;

      // with no milestones, result is an empty array
      if ( result && result.data ) {
        for ( var i in result.data ) {
          if ( result.data[i].title == next_major ) {
            create_major = false;
          }
          if ( result.data[i].title == next_minor ) {
            create_minor = false;
          }
          if ( result.data[i].title == next_patch ) {
            create_patch = false;
          }
          if ( result.data[i].title == ver ) {
            ver_ms = result.data[i].number;
          }
        }
      }

      if ( ver_ms ) {
        console.log('Closing current milestone: '+ver);
        github.issues.updateMilestone( {
          'owner'  : owner,
          'repo'   : repo,
          'number' : ver_ms,
          'state'  : 'closed',
          'title'  : ver,
        } );
      } else {
        console.log( 'Current release milestone does not exist' );
      }

      if ( create_major ) {
        console.log('Creating next major milestone: ' + next_major);
        github.issues.createMilestone( {
          'owner' : owner,
          'repo'  : repo,
          'state' : 'open',
          'title' : next_major,
        } );
      } else {
        console.log( 'Next major milestone already exists: ' + next_major );
      }

      if ( create_minor ) {
        console.log('Creating next minor milestone: ' + next_minor);
        github.issues.createMilestone( {
          'owner' : owner,
          'repo'  : repo,
          'state' : 'open',
          'title' : next_minor,
        } );
      } else {
        console.log( 'Next minor milestone already exists: ' + next_minor );
      }

      if ( create_patch ) {
        console.log('Creating next patch milestone: ' + next_patch);
        github.issues.createMilestone( {
          'owner' : owner,
          'repo'  : repo,
          'state' : 'open',
          'title' : next_patch,
        } );
      } else {
        console.log( 'Next patch milestone already exists: ' + next_patch );
      }
    } );

  } );
}
