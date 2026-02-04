import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Order "mo:core/Order";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Specify the migration function in with clause

actor {
  type Task = {
    id : Nat;
    name : Text;
    description : Text;
    dueDate : ?Time.Time;
    completed : Bool;
    assignedTo : ?Principal;
    createdBy : Principal;
    recurringChoreId : ?Nat;
  };

  type CookingAssignment = {
    day : Text;
    cook : ?Principal;
    cookName : ?Text;
    description : Text;
    assignedBy : Principal;
  };

  type CalendarDay = {
    date : Time.Time;
    tasks : [Task];
    cookingAssignment : ?CookingAssignment;
  };

  type GetCalendarRequest = {
    startDate : Time.Time;
    endDate : Time.Time;
  };

  type FilterByAssigneeRequest = {
    assignee : Principal;
  };

  type AddTaskRequest = {
    name : Text;
    description : Text;
    dueDate : ?Time.Time;
    assignedTo : ?Principal;
  };

  type Timeline = {
    #daily;
    #weeklies;
    #fortnightly;
    #monthly;
  };

  type RecurringChore = {
    id : Nat;
    name : Text;
    description : Text;
    assignedTo : ?Principal;
    timeline : Timeline;
    weekday : Nat;
    createdBy : Principal;
    paused : Bool;
  };

  type CreateRecurringChoreRequest = {
    name : Text;
    description : Text;
    assignedTo : ?Principal;
    timeline : Timeline;
    weekday : Nat;
  };

  type UpdateRecurringChoreRequest = {
    id : Nat;
    name : Text;
    description : Text;
    assignedTo : ?Principal;
    timeline : Timeline;
    weekday : Nat;
  };

  type PersonProfile = {
    principal : Principal;
    displayName : Text;
    color : Text;
  };

  type PauseResumeChoreRequest = {
    id : Nat;
    pause : Bool;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextTaskId = 0;
  var nextRecurringChoreId = 0;
  let tasks = Map.empty<Nat, Task>();
  let cookingAssignments = Map.empty<Text, CookingAssignment>();
  let recurringChores = Map.empty<Nat, RecurringChore>();
  let peopleProfiles = Map.empty<Principal, PersonProfile>();

  public shared ({ caller }) func upsertProfile(profile : PersonProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to manage profiles");
    };
    if (caller != profile.principal) {
      Runtime.trap("Unauthorized: Can only manage your own profile");
    };
    peopleProfiles.add(profile.principal, profile);
  };

  public shared ({ caller }) func deleteProfile(principal : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to delete profiles");
    };
    if (caller != principal) {
      Runtime.trap("Unauthorized: Can only delete your own profile");
    };
    switch (peopleProfiles.get(principal)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?_profile) { peopleProfiles.remove(principal) };
    };
  };

  public query ({ caller }) func getProfile(principal : Principal) : async PersonProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view profiles");
    };
    switch (peopleProfiles.get(principal)) {
      case (null) { Runtime.trap("Profile not found for requested principal") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllProfiles() : async [PersonProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view profiles");
    };
    peopleProfiles.values().toArray();
  };

  public shared ({ caller }) func addTask(request : AddTaskRequest) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to add tasks");
    };
    let task : Task = {
      id = nextTaskId;
      name = request.name;
      description = request.description;
      dueDate = request.dueDate;
      completed = false;
      assignedTo = request.assignedTo;
      createdBy = caller;
      recurringChoreId = null;
    };
    nextTaskId += 1;
    tasks.add(task.id, task);
    task.id;
  };

  public type _GetTaskRequest = { id : Nat };
  public type _AssignCookingDayRequest = {
    day : Text;
    cook : ?Principal;
    cookName : ?Text;
  };

  public shared ({ caller }) func updateTask(id : Nat, name : Text, description : Text, dueDate : ?Time.Time, assignedTo : ?Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to update tasks");
    };
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) {
        if (existingTask.createdBy != caller) {
          Runtime.trap("Cannot update task you did not create");
        };
        let updatedTask : Task = {
          id;
          name;
          description;
          dueDate;
          completed = existingTask.completed;
          assignedTo;
          createdBy = existingTask.createdBy;
          recurringChoreId = existingTask.recurringChoreId;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered member to delete tasks");
    };
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Cannot delete task you did not create");
        };
        tasks.remove(id);
      };
    };
  };

  public shared ({ caller }) func toggleTaskCompletion(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to mark tasks");
    };
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?existingTask) {
        let updatedTask : Task = {
          id = existingTask.id;
          name = existingTask.name;
          description = existingTask.description;
          dueDate = existingTask.dueDate;
          completed = not existingTask.completed;
          assignedTo = existingTask.assignedTo;
          createdBy = existingTask.createdBy;
          recurringChoreId = existingTask.recurringChoreId;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func clearCompletedTasks() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to clear tasks");
    };
    let completedTasks = List.empty<Nat>();
    for (task in tasks.values()) {
      if (task.completed and task.createdBy == caller) {
        completedTasks.add(task.id);
      };
    };
    for (id in completedTasks.values()) {
      tasks.remove(id);
    };
  };

  public type AssignCookingDayRequest = {
    day : Text;
    cook : ?Principal;
    cookName : ?Text;
    description : Text;
  };
  public type UpdateCookingDayRequest = {
    day : Text;
    cook : ?Principal;
    cookName : ?Text;
    description : Text;
  };

  public shared ({ caller }) func assignCookingDay(request : AssignCookingDayRequest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to assign cooking");
    };
    let assignment : CookingAssignment = {
      day = request.day;
      cook = request.cook;
      cookName = request.cookName;
      description = request.description;
      assignedBy = caller;
    };
    cookingAssignments.add(request.day, assignment);
  };

  public shared ({ caller }) func updateCookingDay(request : UpdateCookingDayRequest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to update cooking assignments");
    };
    let existing = cookingAssignments.get(request.day);
    switch (existing) {
      case (null) { Runtime.trap("Assignment not found") };
      case (?assignment) {
        if (assignment.assignedBy != caller) {
          Runtime.trap("Cannot edit assignment you did not create");
        };
        let updatedAssignment : CookingAssignment = {
          day = request.day;
          cook = request.cook;
          cookName = request.cookName;
          description = request.description;
          assignedBy = caller;
        };
        cookingAssignments.add(request.day, updatedAssignment);
      };
    };
  };

  public shared ({ caller }) func createRecurringChore(request : CreateRecurringChoreRequest) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to create recurring chores");
    };
    if (request.weekday > 6) {
      Runtime.trap("Invalid weekday: must be 0-6");
    };

    // Removed the check requiring the assignedTo principal to exist in peopleProfiles

    let chore : RecurringChore = {
      id = nextRecurringChoreId;
      name = request.name;
      description = request.description;
      assignedTo = request.assignedTo;
      timeline = request.timeline;
      weekday = request.weekday;
      createdBy = caller;
      paused = false;
    };

    nextRecurringChoreId += 1;
    recurringChores.add(chore.id, chore);
    chore.id;
  };

  public shared ({ caller }) func updateRecurringChore(request : UpdateRecurringChoreRequest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to update recurring chores");
    };
    if (request.weekday > 6) {
      Runtime.trap("Invalid weekday: must be 0-6");
    };
    switch (recurringChores.get(request.id)) {
      case (null) { Runtime.trap("Recurring chore not found") };
      case (?existingChore) {
        if (existingChore.createdBy != caller) {
          Runtime.trap("Cannot update recurring chore you did not create");
        };
        let updatedChore : RecurringChore = {
          id = request.id;
          name = request.name;
          description = request.description;
          assignedTo = request.assignedTo;
          timeline = request.timeline;
          weekday = request.weekday;
          createdBy = existingChore.createdBy;
          paused = existingChore.paused;
        };
        recurringChores.add(request.id, updatedChore);
      };
    };
  };

  public shared ({ caller }) func deleteRecurringChore(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to delete recurring chores");
    };
    switch (recurringChores.get(id)) {
      case (null) { Runtime.trap("Recurring chore not found") };
      case (?chore) {
        if (chore.createdBy != caller) {
          Runtime.trap("Cannot delete recurring chore you did not create");
        };
        recurringChores.remove(id);
      };
    };
  };

  public shared ({ caller }) func pauseResumeRecurringChore(request : PauseResumeChoreRequest) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to pause or resume recurring chores");
    };
    switch (recurringChores.get(request.id)) {
      case (null) { Runtime.trap("Recurring chore not found") };
      case (?existingChore) {
        if (existingChore.createdBy != caller) {
          Runtime.trap("Cannot pause/resume chore you did not create");
        };
        let updatedChore : RecurringChore = {
          id = existingChore.id;
          name = existingChore.name;
          description = existingChore.description;
          assignedTo = existingChore.assignedTo;
          timeline = existingChore.timeline;
          weekday = existingChore.weekday;
          createdBy = existingChore.createdBy;
          paused = request.pause;
        };
        recurringChores.add(request.id, updatedChore);
      };
    };
  };

  public query ({ caller }) func getAllRecurringChores() : async [RecurringChore] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view recurring chores");
    };
    recurringChores.values().toArray();
  };

  public query ({ caller }) func getActiveRecurringChores() : async [RecurringChore] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view recurring chores");
    };
    let activeChores = List.empty<RecurringChore>();
    for (chore in recurringChores.values()) {
      if (not chore.paused) {
        activeChores.add(chore);
      };
    };
    activeChores.toArray();
  };

  public query ({ caller }) func getRecurringChore(id : Nat) : async RecurringChore {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view recurring chores");
    };
    switch (recurringChores.get(id)) {
      case (null) { Runtime.trap("Recurring chore not found") };
      case (?chore) { chore };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    tasks.values().toArray();
  };

  public query ({ caller }) func getTasksByDate(date : Time.Time) : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    let matchingTasks = List.empty<Task>();
    for (task in tasks.values()) {
      switch (task.dueDate) {
        case (null) {};
        case (?dueDate) {
          if (dueDate == date) {
            matchingTasks.add(task);
          };
        };
      };
    };
    matchingTasks.toArray();
  };

  public query ({ caller }) func getCookingAssignments() : async [CookingAssignment] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view cooking assignments");
    };
    cookingAssignments.values().toArray();
  };

  public query ({ caller }) func getCalendar(request : GetCalendarRequest) : async [CalendarDay] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view calendar");
    };
    let calendarDays = List.empty<CalendarDay>();

    for (task in tasks.values()) {
      switch (task.dueDate) {
        case (null) {};
        case (?dueDate) {
          if (dueDate >= request.startDate and dueDate <= request.endDate) {
            let cookingAssignment = cookingAssignments.get(task.name);
            let day : CalendarDay = {
              date = dueDate;
              tasks = [task];
              cookingAssignment;
            };
            calendarDays.add(day);
          };
        };
      };
    };

    calendarDays.toArray();
  };

  public query ({ caller }) func getTask(id : Nat) : async Task {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
  };

  public type GetCookingAssignment = {
    day : Text;
  };
  public query ({ caller }) func getCookingAssignment(request : GetCookingAssignment) : async CookingAssignment {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view cooking assignments");
    };
    switch (cookingAssignments.get(request.day)) {
      case (null) { Runtime.trap("Assignment not found") };
      case (?assignment) { assignment };
    };
  };

  public query ({ caller }) func getTasksByAssignee(request : FilterByAssigneeRequest) : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    let matchingTasks = List.empty<Task>();
    for (task in tasks.values()) {
      switch (task.assignedTo) {
        case (?assignedTo) {
          if (assignedTo == request.assignee) {
            matchingTasks.add(task);
          };
        };
        case (null) {};
      };
    };
    matchingTasks.toArray();
  };

  public query ({ caller }) func getPendingTasks() : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    let pendingTasks = List.empty<Task>();
    for (task in tasks.values()) {
      if (not task.completed) {
        pendingTasks.add(task);
      };
    };
    pendingTasks.toArray();
  };

  public query ({ caller }) func getCompletedTasks() : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to view tasks");
    };
    let completedTasks = List.empty<Task>();
    for (task in tasks.values()) {
      if (task.completed) {
        completedTasks.add(task);
      };
    };
    completedTasks.toArray();
  };

  public type SortTasksByDueDateRequest = {
    tasks : [Task];
  };
  public query ({ caller }) func sortTasksByDueDate(request : SortTasksByDueDateRequest) : async [Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a registered user to sort tasks");
    };
    request.tasks.sort(
      func(a, b) {
        switch (a.dueDate, b.dueDate) {
          case (null, null) { #equal };
          case (null, ?_) { #greater };
          case (?_, null) { #less };
          case (?aDate, ?bDate) {
            Nat.compare(aDate.toNat(), bDate.toNat());
          };
        };
      }
    );
  };
};
