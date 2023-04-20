import { Utils } from '@twilio/flex-ui-core';
import { FlexPlugin } from '@twilio/flex-plugin';



const PLUGIN_NAME = 'HoldTimePlugin';

export default class HoldTimePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    const getCustomerParticipant = (task) => {
      const conferenceChildren = task?.conference?.participants || [];

      const customerParticipant = conferenceChildren.find(p => p?.participantType === 'customer');

      return customerParticipant;
    }

    window.Handlebars.registerHelper('CustomTaskLineCallAssigned', (payload) => {
      const task = payload?.data?.root?.task
      const customerParticipant = getCustomerParticipant(task);

      const isCustomerOnHold = customerParticipant?.onHold;
      let customerUpdatedTimestamp = customerParticipant?.mediaProperties.timestamp;
      
      if (isCustomerOnHold && !customerUpdatedTimestamp) {
        // mediaProperties.timestamp is undefined for supervisors. To work around this, the
        // agent's HoldCall/HoldParticipant actions set a worker attribute with the timestamp
        // of the hold. Here, we attempt to use that timestamp.
        // TODO: Remove all of this if the mediaProperties.timestamp property begins populating for supervisors.
        const { workers } = manager.store.getState().flex.supervisor;
        
        const worker = workers?.find((w) => w.worker?.sid === task?.workerSid);
        
        customerUpdatedTimestamp = worker?.worker?.attributes?.lastHoldStart;
      }

      let timeSinceTaskUpdated;
      if (task?.dateUpdated) {
        timeSinceTaskUpdated = Math.max(Date.now() - task.dateUpdated.getTime(), 0)
      }

      let timeSinceCustomerUpdated;
      if (isCustomerOnHold && customerUpdatedTimestamp) {
        timeSinceCustomerUpdated = Math.max(Date.now() - new Date(customerUpdatedTimestamp).getTime(), 0)
      }

      const value = isCustomerOnHold
        ? `Hold ${timeSinceCustomerUpdated ? `| ${Utils.formatTimeDuration(timeSinceCustomerUpdated)}` : ''}`
        : `Live ${timeSinceTaskUpdated ? `| ${Utils.formatTimeDuration(timeSinceTaskUpdated)}` : ''}`

      return value;
    });

    manager.strings.TaskLineCallAssigned = '{{CustomTaskLineCallAssigned}}';
    manager.strings.TaskHeaderStatusAccepted = '{{CustomTaskLineCallAssigned}}';
    manager.strings.SupervisorTaskLive = '{{CustomTaskLineCallAssigned}}';
    manager.strings.TaskHeaderGroupCallAccepted = "{{CustomTaskLineCallAssigned}} | {{{icon name='Participant'}}} {{task.conference.liveParticipantCount}}" ;
    manager.strings.TaskLineGroupCallAssigned = "{{CustomTaskLineCallAssigned}} | {{{icon name='Participant'}}} {{task.conference.liveParticipantCount}}";
    manager.strings.SupervisorTaskGroupCall = "{{CustomTaskLineCallAssigned}} | {{task.conference.liveParticipantCount}}";
    
    // The following section works around an issue with supervisors not being able
    // to see hold time in the teams view. Supervisors don't receive the hold timestamp,
    // so as a workaround, we set that here as a worker attribute, which the supervisor
    // teams view will fetch.
    // TODO: Remove all of this if the mediaProperties.timestamp property begins populating for supervisors.
    const setHoldStart = () => {
      flex.Actions.invokeAction("SetWorkerAttributes", {
        mergeExisting: true,
        attributes: {
          lastHoldStart: Date.now()
        }
      });
    }
    
    flex.Actions.addListener('beforeHoldCall', () => {
      setHoldStart();
    })
    
    flex.Actions.addListener('beforeHoldParticipant', () => {
      setHoldStart();
    })
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
 
}
