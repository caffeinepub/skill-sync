import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Timer "mo:core/Timer";
import Principal "mo:core/Principal";

module {
  type Session = {
    id : Nat;
    user : Principal;
    duration : Nat;
    isActive : Bool;
  };

  type Feedback = {
    sessionId : Nat;
    rating : Nat;
    comment : Text;
  };

  type TimedSession = {
    session : Session;
    timerId : Timer.TimerId;
    startTime : Int;
  };

  type CallStatus = {
    #initiated;
    #answered;
    #ended;
  };

  type Call = {
    caller : Principal;
    callee : Principal;
    status : CallStatus;
    offer : ?Text;
    answer : ?Text;
    callerIceCandidates : [Text];
    calleeIceCandidates : [Text];
  };

  type UserProfile = {
    name : Text;
    skills : [Text];
    credits : Nat;
    feedback : [Feedback];
  };

  type OldActor = {
    nextSessionId : Nat;
    nextCallId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
    sessions : Map.Map<Nat, Session>;
    timedSessions : Map.Map<Nat, TimedSession>;
    calls : Map.Map<Nat, Call>;
    userActiveCalls : Map.Map<Principal, Nat>;
  };

  type ScheduledSession = {
    id : Nat;
    host : Principal;
    participant : ?Principal;
    scheduledTime : Int;
    duration : Nat;
    isActive : Bool;
    joined : Bool;
  };

  type NewActor = {
    nextSessionId : Nat;
    nextCallId : Nat;
    nextScheduledSessionId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
    sessions : Map.Map<Nat, Session>;
    timedSessions : Map.Map<Nat, TimedSession>;
    calls : Map.Map<Nat, Call>;
    userActiveCalls : Map.Map<Principal, Nat>;
    scheduledSessions : Map.Map<Nat, ScheduledSession>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      nextScheduledSessionId = 1;
      scheduledSessions = Map.empty<Nat, ScheduledSession>();
    };
  };
};
