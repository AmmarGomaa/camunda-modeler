/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import DeploymentEventHandler from '../DeploymentEventHandler';

import engineProfileXML from './fixtures/engine-profile.bpmn';
import engineProfileDMN from './fixtures/engine-platform.dmn';

import emptyDMN from './fixtures/empty.dmn';

import emptyXML from './fixtures/empty.bpmn';
import MixpanelHandler from '../../MixpanelHandler';

const EXAMPLE_ERROR = 'something went wrong';


describe('<DeploymentEventHandler>', () => {

  let subscribe, track;

  beforeEach(() => {

    subscribe = sinon.spy();

    track = sinon.spy();

    new DeploymentEventHandler({ track, subscribe });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });

  it('should subscribe to deployment.done', () => {
    expect(subscribe.getCall(0).args[0]).to.eql('deployment.done');
  });


  it('should subscribe to deployment.error', () => {
    expect(subscribe.getCall(1).args[0]).to.eql('deployment.error');
  });


  it('should send for type bpmn', async () => {

    // given
    const tab = createTab({
      type: 'bpmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'deploymentTool',
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'Camunda'
      }
    });

    // then
    expect(track).to.have.been.calledWith('deploy:success', {
      diagramType: 'bpmn',
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'Camunda'
      }
    });
  });


  it('should send for type cloud-bpmn', async () => {

    // given
    const tab = createTab({
      type: 'cloud-bpmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'deploymentTool'
    });

    // then
    expect(track).to.have.been.calledWith('deploy:success', {
      diagramType: 'bpmn'
    });
  });


  it('should send for type dmn', async () => {

    // given
    const tab = createTab({
      type: 'dmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'startInstanceTool',
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'Camunda'
      }
    });

    // then
    expect(track).to.have.been.calledWith('startInstance:success', {
      diagramType: 'dmn',
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'Camunda'
      }
    });
  });


  it('should send for type cloud dmn', async () => {

    // given
    const tab = createTab({
      type: 'cloud-dmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'startInstanceTool',
      deployedTo: {
        executionPlatformVersion: '8.0.0',
        executionPlatform: 'Camunda'
      }
    });

    // then
    expect(track).to.have.been.calledWith('startInstance:success', {
      diagramType: 'dmn',
      deployedTo: {
        executionPlatformVersion: '8.0.0',
        executionPlatform: 'Camunda'
      }
    });
  });


  it('should NOT send for type cmmn', async () => {

    // given
    const tab = createTab({
      type: 'cmmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({ tab });

    // then
    expect(track).to.not.have.been.called;
  });


  it('should send deployment error', async () => {

    // given
    const tab = createTab({
      type: 'bpmn'
    });

    const error = {
      code: EXAMPLE_ERROR
    };

    const handleDeploymentError = subscribe.getCall(1).args[1];

    // when
    await handleDeploymentError({
      tab,
      error,
      context: 'deploymentTool',
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'camunda'
      }
    });

    const deployment = track.getCall(0).args[1];

    // then
    expect(track).to.have.been.calledOnce;
    expect(deployment).to.eql({
      diagramType: 'bpmn',
      error: EXAMPLE_ERROR,
      deployedTo: {
        executionPlatformVersion: '7.15.0',
        executionPlatform: 'camunda'
      }
    });
  });


  describe('engine profile', () => {

    it('should send engine profile', async () => {

      // given
      const tab = createTab({
        type: 'bpmn',
        file: {
          contents: engineProfileXML
        }
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

      // then
      expect(executionPlatform).to.eql('Camunda Platform');
      expect(executionPlatformVersion).to.eql('7.15.0');

    });


    it('should send default engine profile', async () => {

      // given
      const tab = createTab({
        type: 'bpmn',
        file: {
          contents: emptyXML
        }
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      const { executionPlatform } = track.getCall(0).args[1];

      // then
      expect(executionPlatform).to.eql('Camunda Platform');
    });


    it('should send default engine profile (cloud tabs)', async () => {

      // given
      const tab = createTab({
        type: 'cloud-bpmn',
        file: {
          contents: emptyXML
        }
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      const { executionPlatform } = track.getCall(0).args[1];

      // then
      expect(executionPlatform).to.eql('Camunda Cloud');

    });


    describe('dmn', function() {

      it('should send engine profile', async () => {

        // given
        const tab = createTab({
          type: 'dmn',
          file: {
            contents: engineProfileDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
        expect(executionPlatformVersion).to.eql('7.16.0');


      });


      it('should send default engine profile', async () => {

        // given
        const tab = createTab({
          type: 'dmn',
          file: {
            contents: emptyDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
      });


      it('should send default engine profile (cloud tabs)', async () => {

        // given
        const tab = createTab({
          type: 'cloud-dmn',
          file: {
            contents: emptyDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Cloud');
      });
    });

  });


  it('should send target type', async () => {

    // given
    const tab = createTab({
      type: 'cloud-bpmn'
    });

    const cloudTargetType = 'camundaCloud';

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({ tab, targetType: cloudTargetType });

    const { targetType } = track.getCall(0).args[1];

    // then
    expect(targetType).to.eql(cloudTargetType);
  });

});


// helpers ///////////////

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'foo',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}
