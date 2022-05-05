import React from 'react';
import { VERSION, Utils } from '@twilio/flex-ui';
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
  async init(flex, manager) {
    const getCustomerParticipant = (task) => {
      const conferenceChildren = task?.conference?.source?.children || [];

      const customerParticipant = conferenceChildren.find(p => p?.value?.participant_type === 'customer');

      return customerParticipant;
    }

    window.Handlebars.registerHelper('CustomTaskLineCallAssigned', (payload) => {
      const task = payload?.data?.root?.task
      const customerParticipant = getCustomerParticipant(task);

      const isCustomerOnHold = customerParticipant?.value?.hold;
      const customerUpdatedTimestamp = customerParticipant?.dateUpdated;

      let timeSinceTaskUpdated;
      if (task?.dateUpdated) {
        timeSinceTaskUpdated = Math.max(Date.now() - task.dateUpdated.getTime(), 0)
      }

      let timeSinceCustomerUpdated;
      if (customerUpdatedTimestamp) {
        timeSinceCustomerUpdated = Math.max(Date.now() - customerUpdatedTimestamp.getTime(), 0)
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
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
 
}
