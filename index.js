module.exports = (robot) => {
  console.log( 'Welcome to Probot semver' );

  robot.on( 'release.published', release_published );
  robot.on( 'create', pointer_created );

  async function pointer_created( context ) {
    var github  = context.github;
    var owner, repo;

    [owner,repo] = context.payload.repository.full_name.split( '/' );

    if ( 'tag' === context.payload.ref_type ) {
      // A tag was created.
      console.log( context.payload.sender.login + ' tagged ' + owner + '/' + repo + ' ' + context.payload.ref + '!' );

      // probot semver expects a semver string to be present in the tag, with an optional prefix
      var matches = context.payload.ref.match( /[0-9]+\.[0-9]+\.[0-9]+$/ );

      if ( ! matches ) {
        console.log('Could not detect a semver :(');
        return;
      }
      var ver = matches[0];

      // Fetch all milestones
      github.issues.getMilestones( {
        'owner' : owner,
        'repo'  : repo,
        'state' : 'open',
      }, function( error, result ) {
        var ver_ms = null;

        // with no milestones, result is an empty array
        if ( result && result.data ) {
          for ( var i in result.data ) {
            // Determine matching milestone
            if ( result.data[i].title == ver ) {
              ver_ms = result.data[i].number;
              break;
            }
          }

          if ( ! ver_ms ) {
            // nothing to do here
            return;
          }

          // Fetch all open issues for milestone
          github.issues.getForRepo({
            'owner'    : owner,
            'repo'     : repo,
            'state'    : 'open',
            'milestone': ver_ms,
            'sort'     : 'created',
            'direction': 'asc',
          }, function( error, result ) {
            if ( result && result.data && result.data.length ) {
              // There are open issues in the milestone
              // Open an issue
              // - list references and titles to the open issues
              // - assign to the user who pushed the tag
              // - place in the milestone that was just pushed

              var body = '';
              var issue = null;

              for ( var i in result.data ) {
                issue = result.data[i];
                body += '* #' + issue.number + ': ' + issue.title + '\n';
              }

              var tag_url = context.payload.repository.html_url + '/releases/tag/' + context.payload.ref;

              body = '[' + context.payload.ref + '](' + tag_url + ') was tagged by @' + context.payload.sender.login + ' but the following tickets in the milestone are still open:\n\n' + body;

              github.issues.create({
                'owner'    : owner,
                'repo'     : repo,
                'title'    : 'There are open issues in the ' + ver + ' milestone',
                'body'     : body,
                'assignee' : context.payload.sender.login,
                'milestone': ver_ms,
              }, function(){
                console.log('Issue created');
              });
            }
          });
        }
      } );

    }
  }

  async function release_published( context ) {
    var release = context.payload.release;
    var github = context.github;
    var owner, repo;

    [owner,repo] = context.payload.repository.full_name.split( '/' );

    console.log( release.author.login + ' released ' + owner + '/' + repo + ' ' + release.tag_name + '!' );

    // probot semver expects a semver string to be present in the tag, with an optional prefix
    var matches = release.tag_name.match( /[0-9]+\.[0-9]+\.[0-9]+$/ );

    if ( ! matches ) {
      console.log('Could not detect a semver :(');
      return;
    }
    var ver = matches[0];
    var major, minor, patch;

    [major,minor,patch] = ver.split( '.' );

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

  }
}
