import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Call {
    status: CallStatus;
    offer?: string;
    answer?: string;
    callee: Principal;
    caller: Principal;
    callerIceCandidates: Array<string>;
    calleeIceCandidates: Array<string>;
}
export interface UserProfile {
    credits: bigint;
    name: string;
    feedback: Array<Feedback>;
    skills: Array<string>;
}
export interface Feedback {
    comment: string;
    sessionId: bigint;
    rating: bigint;
}
export enum CallStatus {
    initiated = "initiated",
    answered = "answered",
    ended = "ended"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIceCandidate(callId: bigint, candidate: string): Promise<void>;
    answerCall(callId: bigint, answer: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createUserProfile(name: string, skills: Array<string>): Promise<void>;
    endCall(callId: bigint): Promise<void>;
    getActiveCall(): Promise<Call | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initiateCall(callee: Principal, offer: string): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSession(): Promise<bigint>;
    submitFeedback(sessionId: bigint, rating: bigint, comment: string): Promise<void>;
}
