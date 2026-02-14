import Map "mo:core/Map";
import Time "mo:core/Time";
import List "mo:core/List";
import Timer "mo:core/Timer";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type UserProfile = {
    name : Text;
    skills : [Text];
    credits : Nat;
    feedback : [Feedback];
  };

  public type Session = {
    id : Nat;
    user : Principal;
    duration : Nat;
    isActive : Bool;
  };

  public type Feedback = {
    sessionId : Nat;
    rating : Nat;
    comment : Text;
  };

  public type TimedSession = {
    session : Session;
    timerId : Timer.TimerId;
    startTime : Int;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextSessionId = 1;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Nat, Session>();
  let timedSessions = Map.empty<Nat, TimedSession>();

  // Get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Get any user's profile (own or admin viewing others)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Save/update caller's profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Create user profile (first-time setup)
  public shared ({ caller }) func createUserProfile(name : Text, skills : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    switch (userProfiles.get(caller)) {
      case (?_) { Runtime.trap("Profile already exists") };
      case (null) {
        let profile : UserProfile = {
          name;
          skills;
          credits = 0;
          feedback = [];
        };
        userProfiles.add(caller, profile);
      };
    };
  };

  // Start a live session with timer
  public shared ({ caller }) func startSession() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start sessions");
    };

    let sessionId = nextSessionId;
    nextSessionId += 1;

    let session : Session = {
      id = sessionId;
      user = caller;
      duration = 0;
      isActive = true;
    };

    // Set timer for 60 seconds
    let timerId = Timer.setTimer<system>(#seconds 60, func() : async () { await completeSession(sessionId) });

    let timedSession : TimedSession = {
      session;
      timerId;
      startTime = Time.now();
    };

    timedSessions.add(sessionId, timedSession);
    sessions.add(sessionId, session);
    sessionId;
  };

  // Complete session after timer ends
  func completeSession(sessionId : Nat) : async () {
    switch (timedSessions.get(sessionId)) {
      case (?timedSession) {
        let duration = (Time.now() - timedSession.startTime) / 1_000_000_000;
        let updatedSession = {
          timedSession.session with
          duration = Int.abs(duration);
          isActive = false;
        };
        sessions.add(sessionId, updatedSession);
        timedSessions.remove(sessionId);
      };
      case (null) {};
    };
  };

  // Submit feedback for session and calculate credits
  public shared ({ caller }) func submitFeedback(sessionId : Nat, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit feedback");
    };

    switch (sessions.get(sessionId)) {
      case (?session) {
        // Verify ownership: only the session owner can submit feedback
        if (session.user != caller) {
          Runtime.trap("Unauthorized: Can only submit feedback for your own sessions");
        };

        if (not session.isActive) {
          let feedback : Feedback = {
            sessionId;
            rating;
            comment;
          };

          switch (userProfiles.get(caller)) {
            case (?profile) {
              let newCredits = profile.credits + (session.duration * rating);
              let feedbackList = List.fromArray<Feedback>(profile.feedback);
              feedbackList.add(feedback);

              let updatedProfile = {
                profile with
                credits = newCredits;
                feedback = feedbackList.toArray();
              };
              userProfiles.add(caller, updatedProfile);
            };
            case (null) { Runtime.trap("User profile not found") };
          };
        } else {
          Runtime.trap("Session is still active");
        };
      };
      case (null) { Runtime.trap("Session not found") };
    };
  };
};
