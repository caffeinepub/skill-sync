import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Timer "mo:core/Timer";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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

  public type CallStatus = {
    #initiated;
    #answered;
    #ended;
  };

  public type Call = {
    caller : Principal;
    callee : Principal;
    status : CallStatus;
    offer : ?Text;
    answer : ?Text;
    callerIceCandidates : [Text];
    calleeIceCandidates : [Text];
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextSessionId = 1;
  var nextCallId = 1;
  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Nat, Session>();
  let timedSessions = Map.empty<Nat, TimedSession>();
  let calls = Map.empty<Nat, Call>();
  let userActiveCalls = Map.empty<Principal, Nat>();

  // User profile management

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

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

  // Session management

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

    let timerId = Timer.setTimer<system>(
      #seconds 60,
      func() : async () { await completeSession(sessionId) },
    );

    let timedSession : TimedSession = {
      session;
      timerId;
      startTime = Time.now();
    };

    timedSessions.add(sessionId, timedSession);
    sessions.add(sessionId, session);
    sessionId;
  };

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

  // Remaining session methods...

  public shared ({ caller }) func submitFeedback(sessionId : Nat, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit feedback");
    };

    switch (sessions.get(sessionId)) {
      case (?session) {
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

  // WebRTC call signaling

  public shared ({ caller }) func initiateCall(callee : Principal, offer : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate calls");
    };

    if (caller == callee) {
      Runtime.trap("Cannot call yourself");
    };

    let callId = nextCallId;
    nextCallId += 1;

    let call : Call = {
      caller;
      callee;
      status = #initiated;
      offer = ?offer;
      answer = null;
      callerIceCandidates = [];
      calleeIceCandidates = [];
    };

    calls.add(callId, call);
    userActiveCalls.add(caller, callId);
    userActiveCalls.add(callee, callId);

    callId;
  };

  public query ({ caller }) func getActiveCall() : async ?Call {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view calls");
    };

    switch (userActiveCalls.get(caller)) {
      case (?callId) {
        calls.get(callId);
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func answerCall(callId : Nat, answer : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can answer calls");
    };

    switch (calls.get(callId)) {
      case (?existingCall) {
        if (existingCall.callee != caller) {
          Runtime.trap("Unauthorized: Only the callee can answer this call");
        };

        if (existingCall.status != #initiated) {
          Runtime.trap("Call has already been answered or ended");
        };

        let updatedCall = {
          existingCall with
          answer = ?answer;
          status = #answered;
        };
        calls.add(callId, updatedCall);
      };
      case (null) { Runtime.trap("Call not found") };
    };
  };

  public shared ({ caller }) func addIceCandidate(callId : Nat, candidate : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send ICE candidates");
    };

    switch (calls.get(callId)) {
      case (?existingCall) {
        let updatedCall = if (existingCall.caller == caller) {
          {
            existingCall with
            callerIceCandidates = existingCall.callerIceCandidates.concat([candidate]);
          };
        } else if (existingCall.callee == caller) {
          {
            existingCall with
            calleeIceCandidates = existingCall.calleeIceCandidates.concat([candidate]);
          };
        } else {
          Runtime.trap("Unauthorized: Only call participants can submit ICE candidates");
        };

        calls.add(callId, updatedCall);
      };
      case (null) { Runtime.trap("Call not found") };
    };
  };

  public shared ({ caller }) func endCall(callId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end calls");
    };

    switch (calls.get(callId)) {
      case (?existingCall) {
        if (existingCall.caller != caller and existingCall.callee != caller) {
          Runtime.trap("Unauthorized: Only call participants can end the call");
        };

        let updatedCall = {
          existingCall with
          status = #ended;
        };
        calls.add(callId, updatedCall);

        userActiveCalls.remove(existingCall.caller);
        userActiveCalls.remove(existingCall.callee);
      };
      case (null) { Runtime.trap("Call not found") };
    };
  };
};
