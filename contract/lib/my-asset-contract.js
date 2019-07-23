/* eslint-disable no-trailing-spaces */
/*
 * SPDX-License-Identifier: Apache-2.0
 */
/*jshint esversion: 8 */
/* jshint node: true */

'use strict';

const { Contract } = require('fabric-contract-api');

// predefined project states
const projectStatus = {
    Created: 'Project Created',
    AssignedToLead: 'Project Assigned - Lead Contractor',
    InProgressLead: 'In Progress - Lead Contractor',
    AssignedToSub: 'Project Assigned - Sub Contractor',
    InProgressSub: 'In Progress - Sub Contractor',
    ReviewLead: 'Under Review - Lead Contractor',
    ReviewPO: 'Under Review - Project Owner',
    ReviewInsp: 'Under Review - Inspection Service',
    CompleteInspection: 'Inspection Completed',
    End: 'Project Successfully Completed'
};

const workingStatus = {
    CR: 'Created Project',
    NA: 'Status Not Available',
    AL: 'Awaiting - Lead Contractor',
    WR: 'Working',
    AS: 'Awaiting - Sub Contractor',
    UR: 'Under Review',
    CP: 'Completed',
    IN: 'Inspecting',
    AI: 'Awaiting Inspection'
};

// Maintenance contract
class Maintenance extends Contract {

    // instantiate with keys to collect participant ids
    async Instantiate(ctx) {

        let emptyList = [];
        let tasklist = ['T001', 'T002', 'T003', 'T004', 'T005', 'T006', 'T007', 'T008', 'T009'];
        await ctx.stub.putState('projectOwners', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('Contractors', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('inspectionCos', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('tasks', Buffer.from(JSON.stringify(tasklist)));

    }

    // add a projectOwner object to the blockchain state identifited by the projectOwnerId
    async CreateProjectOwner(ctx, args) {
        args = JSON.parse(args);

        let projectOwner = {
            id: args.userId,
            companyName: args.companyName,
            type: 'projectOwner',
            projects: [],
            entity: 'user'
        };
        await ctx.stub.putState(args.userId, Buffer.from(JSON.stringify(projectOwner)));

        //add projectOwnerId to 'projectOwners' key
        let data = await ctx.stub.getState('projectOwners');
        if (data) {
            let projectOwners = JSON.parse(data.toString());
            projectOwners.push(args.userId);
            await ctx.stub.putState('projectOwners', Buffer.from(JSON.stringify(projectOwners)));
        } else {
            throw new Error('projectOwners not found');
        }

        // return projectOwner object
        return projectOwner;
    }

    // add a Contractor object to the blockchain state identifited by the ContractorId
    async CreateContractor(ctx, args) {

        args = JSON.parse(args);


        let Contractor = {
            id: args.userId,
            companyName: args.companyName,
            type: 'Contractor',
            projects: [],
            entity: 'user'
        };
        await ctx.stub.putState(args.userId, Buffer.from(JSON.stringify(Contractor)));

        // add ContractorId to 'Contractors' key
        let data = await ctx.stub.getState('Contractors');
        if (data) {
            let Contractors = JSON.parse(data.toString());
            Contractors.push(args.userId);
            await ctx.stub.putState('Contractors', Buffer.from(JSON.stringify(Contractors)));
        } else {
            throw new Error('Contractors not found');
        }

        // return Contractor object
        return Contractor;
    }

    // add a inspectionCos object to the blockchain state identifited by the inspectionCoId
    async CreateInspectionCo(ctx, args) {
        args = JSON.parse(args);
        //store inspection Company data identified by inspectionCoId

        let inspectionCo = {
            id: args.userId,
            companyName: args.companyName,
            type: 'inspectionCo',
            projects: [],
            entity: 'user'
        };
        await ctx.stub.putState(args.userId, Buffer.from(JSON.stringify(inspectionCo)));

        //add inspectionCoId to 'inspectionCos' key
        const data = await ctx.stub.getState('inspectionCos');
        if (data) {
            let inspectionCos = JSON.parse(data.toString());
            inspectionCos.push(args.userId);
            await ctx.stub.putState('inspectionCos', Buffer.from(JSON.stringify(inspectionCos)));
        } else {
            throw new Error('inspectionCos not found');
        }

        // return inspectionCo object
        return inspectionCo;
    }

    // add an project object to the blockchain state identifited by the projectId
    async CreateProject(ctx, args) {
        args = JSON.parse(args);
        // verify projectOwnerId


        let projectOwnerData = await ctx.stub.getState(args.userId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }


        let project = {
            project: {
                projectId: args.projectId,
                pipelineId: args.pipelineId,
                projectName: args.projectName,
                status: projectStatus.Created,
                start_date: new Date().toISOString().slice(0, 10),
                end_date: args.end_date,
                cost: args.cost,
                projectOwnerId: args.userId,
                pipelineLength: args.pipelineLength
            },
            contractor: {
                leadContractorId: [],
                subContractorId: []
            },
            task: [],
            workstatus: {},
            inspectionCoId: 'N/A',
            type: 'project'
        };
        project.workstatus[args.userId] = workingStatus.CR;
        //add project to projectOwner
        projectOwner.projects.push(args.projectId);
        await ctx.stub.putState(args.userId, Buffer.from(JSON.stringify(projectOwner)));

        //store project identified by projectId
        await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));

        // return inspectionCo object
        return project;

    }

    async AssignLead(ctx, args) {
        args = JSON.parse(args);

        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }
        // verify projectOwnerId
        let projectOwnerData = await ctx.stub.getState(project.project.projectOwnerId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }

        // verify ContractorId
        let ContractorData = await ctx.stub.getState(args.ContractorId);
        let Contractor;
        if (ContractorData) {
            Contractor = JSON.parse(ContractorData.toString());
            if (Contractor.type !== 'Contractor') {
                throw new Error('Contractor not identified');
            }
        } else {
            throw new Error('Contractor not found');
        }

        // update project status
        if (project.project.status === projectStatus.Created || project.project.status === projectStatus.InProgressLead) {

            project.project.status = projectStatus.InProgressLead;

            project.workstatus[project.project.projectOwnerId] = workingStatus.AL;
            project.workstatus[args.ContractorId] = workingStatus.WR;

            project.contractor.leadContractorId = args.ContractorId.toString();
            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));


            //add project to Contractor
            Contractor.projects.push(args.projectId);
            await ctx.stub.putState(args.ContractorId, Buffer.from(JSON.stringify(Contractor)));

            return project;
        } else {
            throw new Error('Project Status !== created/leadprogress');
        }
    }

    async AssignSub(ctx, args) {
        args = JSON.parse(args);
        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        // verify projectOwnerId
        let projectOwnerData = await ctx.stub.getState(project.project.projectOwnerId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }

        // verify ContractorId
        let ContractorData = await ctx.stub.getState(args.ContractorId);
        let Contractor;
        if (ContractorData) {
            Contractor = JSON.parse(ContractorData.toString());
            if (Contractor.type !== 'Contractor') {
                throw new Error('Contractor not identified');
            }
        } else {
            throw new Error('Contractor not found');
        }

        //update project
        if (project.project.status === projectStatus.InProgressLead || project.project.status === projectStatus.InProgressSub) {
            project.project.status = projectStatus.InProgressSub;

            project.workstatus[project.project.projectOwnerId] = workingStatus.AL;
            project.workstatus[project.contractor.leadContractorId] = workingStatus.AS;
            project.workstatus[args.ContractorId] = workingStatus.WR;

            project.contractor.subContractorId.push(args.ContractorId.toString());

            Contractor.projects.push(args.projectId);

            await ctx.stub.putState(args.ContractorId, Buffer.from(JSON.stringify(Contractor)));
            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));

            return project;
        } else {
            throw new Error('project status !== LeadProgress/SubProgress');
        }

    }

    async SubCompleted(ctx, args) {
        args = JSON.parse(args);
        //get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }


        //verify ContractorId
        let ContractorData = await ctx.stub.getState(args.userId.toString());
        let Contractor;
        if (ContractorData) {
            Contractor = JSON.parse(ContractorData.toString());
            if (Contractor.type !== 'Contractor') {
                throw new Error('Contractor not identified');
            }
        } else {
            throw new Error('Contractor not found');
        }



        //update project
        if (project.project.status === projectStatus.InProgressSub || project.project.status === projectStatus.ReviewLead) {

            project.project.status = projectStatus.ReviewLead;

            project.workstatus[project.project.projectOwnerId] = workingStatus.AL;
            project.workstatus[project.contractor.leadContractorId] = workingStatus.UR;
            project.workstatus[args.userId] = workingStatus.CP;

            Contractor.projects.splice(Contractor.projects.indexOf(args.projectId.toString()), 1);

            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));
            await ctx.stub.putState(args.userId.toString(), Buffer.from(JSON.stringify(Contractor)));

            // // add project to provider
            // provider.projects.push(projectId);
            // await ctx.stub.putState(providerId, Buffer.from(JSON.stringify(provider)));

            return project;
        } else {
            throw new Error('Project Status !== SubProgress/ReviewLead');
        }
    }

    async LeadCompleted(ctx, args) {
        args = JSON.parse(args);
        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        let ContractorData = await ctx.stub.getState(project.contractor.leadContractorId.toString());
        let Contractor;
        if (ContractorData) {
            Contractor = JSON.parse(ContractorData.toString());
            if (Contractor.type !== 'Contractor') {
                throw new Error('Contractor not identified');
            }
        } else {
            throw new Error('Contractor not found');
        }



        // update project
        if (project.project.status === projectStatus.InProgressLead || project.project.status === projectStatus.ReviewLead) {

            project.project.status = projectStatus.ReviewPO;

            project.workstatus[project.project.projectOwnerId] = workingStatus.UR;
            project.workstatus[project.contractor.leadContractorId] = workingStatus.CP;

            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));

            Contractor.projects.splice(Contractor.projects.indexOf(args.projectId.toString()), 1);
            await ctx.stub.putState(project.contractor.leadContractorId.toString(), Buffer.from(JSON.stringify(Contractor)));

            return project;

        } else {
            throw new Error('Project Status !== LeadActions');
        }
    }

    async POCompleted(ctx, args) {
        args = JSON.parse(args);
        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        // verify projectOwnerId
        let projectOwnerData = await ctx.stub.getState(project.project.projectOwnerId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }

        // verify inspectionCoId
        let inspectionCoData = await ctx.stub.getState(args.inspectionCoId);
        let inspectionCo;
        if (inspectionCoData) {
            inspectionCo = JSON.parse(inspectionCoData.toString());
            if (inspectionCo.type !== 'inspectionCo') {
                throw new Error('inspectionCo not identified');
            }
        } else {
            throw new Error('inspectionCo not found');
        }

        // update project
        if (project.project.status === projectStatus.ReviewLead || project.project.status === projectStatus.ReviewPO) {

            project.inspectionCoId = args.inspectionCoId;
            project.project.status = projectStatus.ReviewInsp;

            project.workstatus[project.project.projectOwnerId] = workingStatus.AI;
            project.workstatus[args.inspectionCoId] = workingStatus.IN;

            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));

            // add project to inspectionCo
            inspectionCo.projects.push(args.projectId);
            await ctx.stub.putState(args.inspectionCoId, Buffer.from(JSON.stringify(inspectionCo)));

            return project;
        } else {
            throw new Error('Project status !== PO Review');
        }
    }

    async CompleteInspection(ctx, args) {
        args = JSON.parse(args);
        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        // verify projectOwnerId
        let projectOwnerData = await ctx.stub.getState(project.project.projectOwnerId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }

        // verify inspectionCoId
        let inspectionCoData = await ctx.stub.getState(project.inspectionCoId);
        let inspectionCo;
        if (inspectionCoData) {
            inspectionCo = JSON.parse(inspectionCoData.toString());
            if (inspectionCo.type !== 'inspectionCo') {
                throw new Error('inspectionCo not identified');
            }
        } else {
            throw new Error('inspectionCo not found');
        }

        //update project
        //if ((JSON.parse(project.status).text == projectStatus..text ) || (JSON.parse(project.status).text == projectStatus..text )) {
        if (project.project.status === projectStatus.ReviewInsp) {

            project.project.status = projectStatus.CompleteInspection;

            project.workstatus[project.project.projectOwnerId] = workingStatus.CP;
            project.workstatus[project.inspectionCoId] = workingStatus.CP;

            inspectionCo.projects.splice(inspectionCo.projects.indexOf(args.projectId.toString()), 1);
            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));
            await ctx.stub.putState(project.inspectionCoId.toString(), Buffer.from(JSON.stringify(inspectionCo)));

            return project;
        } else {
            throw new Error('project status !== InspectionReview');
        }
    }

    async FinishProject(ctx, args) {
        args = JSON.parse(args);
        // get project json
        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        let projectOwnerData = await ctx.stub.getState(project.project.projectOwnerId);
        let projectOwner;
        if (projectOwnerData) {
            projectOwner = JSON.parse(projectOwnerData.toString());
            if (projectOwner.type !== 'projectOwner') {
                throw new Error('projectOwner not identified');
            }
        } else {
            throw new Error('projectOwner not found');
        }

        //update project
        //if ((JSON.parse(project.status).text == projectStatus..text ) || (JSON.parse(project.status).text == projectStatus..text )) {
        if (project.project.status === projectStatus.CompleteInspection) {
            project.project.status = projectStatus.End;
            await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));


            projectOwner.projects.splice(projectOwner.projects.indexOf(args.projectId.toString()), 1);
            await ctx.stub.putState(project.project.projectOwnerId, Buffer.from(JSON.stringify(projectOwner)));

            return project;
        } else {
            throw new Error('project inspection still incomplete');
        }
    }

    async enrollCertifiedAsset(ctx, args) {
        args = JSON.parse(args);

        let ContractorData = await ctx.stub.getState(args.userId);
        let Contractor;
        if (ContractorData) {
            Contractor = JSON.parse(ContractorData.toString());
            if (Contractor.entity !== 'user') {
                throw new Error('Contractor not identified');
            }
        } else {
            throw new Error('Contractor not found');
        }

        let certifiedAsset = {
            id: args.assetId,
            name: args.assetName,
            entity: args.userId,
            certificateId: args.certificateId,
            certificateExpiry: args.certificateExpiry,
            type: args.assetType
        };

        if (certifiedAsset.type === 'member') {
            if (Contractor.CMembers) {
                Contractor.CMembers.push(args.assetId);
            } else {
                Contractor.CMembers = [args.assetId];
            }
        }

        if (certifiedAsset.type === 'equipment') {
            if (Contractor.CEquips) {
                Contractor.CEquips.push(args.assetId);
            } else {
                Contractor.CEquips = [args.assetId];
            }
        }


        await ctx.stub.putState(args.userId, Buffer.from(JSON.stringify(Contractor)));
        await ctx.stub.putState(args.assetId, Buffer.from(JSON.stringify(certifiedAsset)));


        return certifiedAsset;
    }

    async AddTasks(ctx, args) {
        args = JSON.parse(args);

        let data = await ctx.stub.getState(args.projectId);
        let project;
        if (data) {
            project = JSON.parse(data.toString());
        } else {
            throw new Error('project not found');
        }

        let T001 = {
            id: 'T001',
            desc: 'Replacement of Valves',
            type: 'task',
            subtask: [{ name: 'Valve replaced', code: 'vr', comments: 'Under Progress', status: false }, { name: 'Valve calibrated and tested', code: 'vcat', comments: 'Under Progress', status: false }, { name: 'Valves opened and closed as required', code: 'voacar', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T002 = {
            id: 'T002',
            desc: 'Replacement of Valve packing',
            type: 'task',
            subtask: [{ name: 'Packing replaced', code: 'pr', comments: 'Under Progress', status: false }, { name: 'Pressure testing', code: 'pt', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T003 = {
            id: 'T003',
            desc: 'Alignment of Orifice Plate',
            type: 'task',
            subtask: [{ name: 'Alignment checked and tested', code: 'act', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T004 = {
            id: 'T004',
            desc: 'Alignment of Globe Valve Direction',
            type: 'task',
            subtask: [{ name: 'Alignment checked and tested', code: 'act', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T005 = {
            id: 'T005',
            desc: 'Replacement of Gate Valve',
            type: 'task',
            subtask: [{ name: 'Valve replaced', code: 'vr', comments: 'Under Progress', status: false }, { name: 'Valve calibrated and tested', code: 'vcat', comments: 'Under Progress', status: false }, { name: 'Valves opened and closed as required', code: 'voacar', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T006 = {
            id: 'T006',
            desc: 'Installation of Permanent Gaskets',
            type: 'task',
            subtask: [{ name: 'Valve replaced', code: 'vr', comments: 'Under Progress', status: false }, { name: 'Pressure testing', code: 'pt', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T007 = {
            id: 'T007',
            desc: 'Torqueing and Tensioning of Flange Bolts',
            type: 'task',
            subtask: [{ name: 'Torqueing completed', code: 'tc', comments: 'Under Progress', status: false }, { name: 'Tensioning completed', code: 'tc', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T008 = {
            id: 'T008',
            desc: 'Replacement of Butterfly valve',
            type: 'task',
            subtask: [{ name: 'Valve replaced', code: 'vr', comments: 'Under Progress', status: false }, { name: 'Valve calibrated and tested', code: 'vcat', comments: 'Under Progress', status: false }, { name: 'Valves opened and closed as required', code: 'voacar', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };

        let T009 = {
            id: 'T009',
            desc: 'Alignment of Non-Return Valve',
            type: 'task',
            subtask: [{ name: 'Alignment checked and tested', code: 'act', comments: 'Under Progress', status: false }],
            project: args.projectId,
            assignedTo: args.ContractorId,
            status: false,
            carriedOutBy: 'NA',
            equipmentUsed: 'NA'
        };


        if (args.t001) {
            let data = await ctx.stub.getState(args.taskId+'001');
            if(!data){
                project.task.push(args.taskId + '001');
            }
            await ctx.stub.putState(args.taskId + '001', Buffer.from(JSON.stringify(T001)));
        }
        if (args.t002) {
            await ctx.stub.putState(args.taskId + '002', Buffer.from(JSON.stringify(T002)));
            project.task.push(args.taskId + '002');

        }
        if (args.t003) {
            await ctx.stub.putState(args.taskId + '003', Buffer.from(JSON.stringify(T003)));
            project.task.push(args.taskId + '003');

        }
        if (args.t004) {
            await ctx.stub.putState(args.taskId + '004', Buffer.from(JSON.stringify(T004)));
            project.task.push(args.taskId + '004');

        }
        if (args.t005) {
            await ctx.stub.putState(args.taskId + '005', Buffer.from(JSON.stringify(T005)));
            project.task.push(args.taskId + '005');

        }
        if (args.t006) {
            await ctx.stub.putState(args.taskId + '006', Buffer.from(JSON.stringify(T006)));
            project.task.push(args.taskId + '006');

        }
        if (args.t007) {
            await ctx.stub.putState(args.taskId + '007', Buffer.from(JSON.stringify(T007)));
            project.task.push(args.taskId + '007');

        }
        if (args.t008) {
            await ctx.stub.putState(args.taskId + '008', Buffer.from(JSON.stringify(T008)));
            project.task.push(args.taskId + '008');

        }
        if (args.t009) {
            await ctx.stub.putState(args.taskId + '009', Buffer.from(JSON.stringify(T009)));
            project.task.push(args.taskId + '009');

        }

        await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));

        return { message: 'Added Tasks Successfully' };
    }

    async AssignTasks(ctx, args) {
        args = JSON.parse(args);
          
        if (args.t001) {
            let data = await ctx.stub.getState(args.taskId+'001');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            } 
            await ctx.stub.putState(args.taskId + '001', Buffer.from(JSON.stringify(task)));
        }
        if (args.t002) {
            let data = await ctx.stub.getState(args.taskId+'002');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '002', Buffer.from(JSON.stringify(task)));
        }
        if (args.t003) {
            let data = await ctx.stub.getState(args.taskId+'003');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '003', Buffer.from(JSON.stringify(task)));
        }
        if (args.t004) {
            let data = await ctx.stub.getState(args.taskId+'004');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            } 
            await ctx.stub.putState(args.taskId + '004', Buffer.from(JSON.stringify(task)));
        }
        if (args.t005) {
            let data = await ctx.stub.getState(args.taskId+'005');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '005', Buffer.from(JSON.stringify(task)));
        }
        if (args.t006) {
            let data = await ctx.stub.getState(args.taskId+'006');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '006', Buffer.from(JSON.stringify(task)));
        }
        if (args.t007) {
            let data = await ctx.stub.getState(args.taskId+'007');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '007', Buffer.from(JSON.stringify(task)));
        }
        if (args.t008) {
            let data = await ctx.stub.getState(args.taskId+'008');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '008', Buffer.from(JSON.stringify(task)));
        }
        if (args.t009) {
            let data = await ctx.stub.getState(args.taskId+'009');
            let task;
            if (data) {
                task = JSON.parse(data.toString());
                task.assignedTo = args.ContractorId;
            }
            await ctx.stub.putState(args.taskId + '009', Buffer.from(JSON.stringify(task)));
        }

        return { message: 'Assigned Tasks Successfully' };
    }

    async CompleteSubTask(ctx, args) {
        args = JSON.parse(args);


        let taskData = await ctx.stub.getState(args.taskId);
        let task;
        if (taskData) {
            task = JSON.parse(taskData.toString());
            if (task.type !== 'task') {
                throw new Error('task not identified');
            }
        } else {
            throw new Error('task not found');
        }

        // let T009 = {
        //     id: 'T009',
        //     desc: 'Alignment of Non-Return Valve',
        //     type: 'task',
        //     subtask: [{name: 'Alignment checked and tested', comments: 'NA', code: 'act', status: false}],
        //     project: args.projectId,
        //     assignedTo: args.ContractorId,
        //     status: false,
        //     carriedOutBy: 'NA',
        //     equipmentUsed: 'NA'
        // };
        for (let i = 0; i < task.subtask.length; i++) {
            for (let j = 0; j < args.code; j++) {
                if (task.subtask[i].code === args.code[j]) {
                    // send the comment using text box name as the subtask code
                    let val = args.code[j];
                    task.subtask[i].status = true;
                    if (args[val]){
                        task.subtask[i].comments = args[val];
                    }
                }
            }
        }

        let finishall = true;
        for (let i = 0; i < task.subtask.length; i++) {
            if (task.subtask[i].status === false) {
                finishall = false;
            }
        }

        if (finishall === true || args.completeAll) {
            task.status = true;
            if (args.carriedOutBy) {
                task.carriedOutBy = args.carriedOutBy;
            }
            if (args.equipmentUsed) {
                task.equipmentUsed = args.equipmentUsed;
            }
        }

        await ctx.stub.putState(args.taskId, Buffer.from(JSON.stringify(task)));
        return task;
    }

    async CreateReview(ctx, args) {
        args = JSON.parse(args);


        let projectData = await ctx.stub.getState(args.projectId);
        let project;
        if (projectData) {
            project = JSON.parse(projectData.toString());
            if (project.type !== 'project') {
                throw new Error('project not identified');
            }
        } else {
            throw new Error('project not found');
        }

        let ReceiverData = await ctx.stub.getState(args.receiverId);
        let receiver;
        if (ReceiverData) {
            receiver = JSON.parse(ReceiverData.toString());
            if (receiver.entity !== 'user') {
                throw new Error('receiver not identified');
            }
        } else {
            throw new Error('receiver not found');
        }

        let SenderData = await ctx.stub.getState(args.senderId);
        let sender;
        if (SenderData) {
            sender = JSON.parse(SenderData.toString());
            if (sender.entity !== 'user') {
                throw new Error('sender not identified');
            }
        } else {
            throw new Error('sender not found');
        }

        let review = {
            projectId: args.projectId,
            reviewId: args.reviewId,
            status: 'Pending',
            sent_date: new Date().toISOString().slice(0, 10),
            checklist: [args.rov, args.rovp, args.opsv, args.aop, args.agvd, args.rgv, args.ipg, args.ttfb, args.rbv, args.anrv].filter(Boolean),
            receiverId: args.receiverId,
            senderId: args.senderId,
            type: 'review'
        };

        if (sender.sentReviews) {
            sender.sentReviews.push(args.reviewId);
        } else {
            sender.sentReviews = [args.reviewId];
        }

        if (receiver.receivedReviews) {
            receiver.receivedReviews.push(args.reviewId);
        } else {
            receiver.receivedReviews = [args.reviewId];
        }

        if (project.reviews) {
            project.reviews.push(args.reviewId);
        } else {
            project.reviews = [args.reviewId];
        }

        await ctx.stub.putState(args.senderId, Buffer.from(JSON.stringify(sender)));
        await ctx.stub.putState(args.receiverId, Buffer.from(JSON.stringify(receiver)));
        await ctx.stub.putState(args.reviewId, Buffer.from(JSON.stringify(review)));
        await ctx.stub.putState(args.projectId, Buffer.from(JSON.stringify(project)));


        return review;
    }

    async ComplyReview(ctx, args) {
        args = JSON.parse(args);


        let reviewData = await ctx.stub.getState(args.reviewId);
        let review;
        if (reviewData) {
            review = JSON.parse(reviewData.toString());
            if (review.type !== 'review') {
                throw new Error('review not identified');
            }
        } else {
            throw new Error('review not found');
        }


        let ReceiverData = await ctx.stub.getState(review.receiverId);
        let receiver;
        if (ReceiverData) {
            receiver = JSON.parse(ReceiverData.toString());
            if (receiver.entity !== 'user') {
                throw new Error('receiver not identified');
            }
        } else {
            throw new Error('receiver not found');
        }

        let SenderData = await ctx.stub.getState(review.senderId);
        let sender;
        if (SenderData) {
            sender = JSON.parse(SenderData.toString());
            if (sender.entity !== 'user') {
                throw new Error('sender not identified');
            }
        } else {
            throw new Error('sender not found');
        }


        // let review = {
        //     projectId: args.projectId,
        //     reviewId: args.reviewId,
        //     status: 'Pending',
        //     sent_date: new Date().toISOString().slice(0, 10),
        //     checklist: [args.rov, args.rovp, args.opsv, args.aop, args.agvd, args.rgv, args.ipg, args.ttfb, args.rbv, args.anrv].filter(Boolean),
        //     receiverId: args.receiverId,
        //     senderId: args.senderId,
        //     type: 'review'
        // };

        sender.sentReviews.splice(sender.sentReviews.indexOf(args.reviewId.toString()), 1);
        receiver.receivedReviews.splice(receiver.receivedReviews.indexOf(args.reviewId.toString()), 1);
        review.status = 'Complied';


        await ctx.stub.putState(review.senderId, Buffer.from(JSON.stringify(sender)));
        await ctx.stub.putState(review.receiverId, Buffer.from(JSON.stringify(receiver)));
        await ctx.stub.putState(args.reviewId, Buffer.from(JSON.stringify(review)));


        return review;
    }

    // get the state from key
    async GetState(ctx, key) {
        let data = await ctx.stub.getState(key);
        let jsonData = JSON.parse(data.toString());
        return jsonData;
    }

    /**
   * Query and return all key value pairs in the world state.
   *
   * @param {Context} ctx the transaction context
   * @returns - all key-value pairs in the world state
  */
    async queryAll(ctx) {

        let queryString = {
            selector: {}
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    /**
     * Evaluate a queryString
     *
     * @param {Context} ctx the transaction context
     * @param {String} queryString the query string to be evaluated
    */
    async queryWithQueryString(ctx, queryString) {

        console.log('query String');
        console.log(JSON.stringify(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return allResults;
            }
        }
    }

    /**
  * Query by the main objects in this app: ballot, election, votableItem, and Voter.
  * Return all key-value pairs of a given type.
  *
  * @param {Context} ctx the transaction context
  * @param {String} objectType the type of the object - should be either ballot, election, votableItem, or Voter
  */
    async queryByObjectType(ctx, objectType) {

        let queryString = {
            selector: {
                type: objectType
            }
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    async queryByEntity(ctx, objectType) {

        let queryString = {
            selector: {
                entity: objectType
            }
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }
    /**
   *
   * deleteMyAsset
   *
   * Deletes a key-value pair from the world state, based on the key given.
   *
   * @param myAssetId - the key of the asset to delete
   * @returns - nothing - but deletes the value in the world state
   */
    async deleteMyAsset(ctx, myAssetId) {

        const exists = await this.myAssetExists(ctx, myAssetId);
        if (!exists) {
            throw new Error(`The my asset ${myAssetId} does not exist`);
        }

        await ctx.stub.deleteState(myAssetId);

    }

    /**
   *
   * readMyAsset
   *
   * Reads a key-value pair from the world state, based on the key given.
   *
   * @param myAssetId - the key of the asset to read
   * @returns - nothing - but reads the value in the world state
   */
    async readMyAsset(ctx, myAssetId) {

        const exists = await this.myAssetExists(ctx, myAssetId);

        if (!exists) {
            // throw new Error(`The my asset ${myAssetId} does not exist`);
            let response = {};
            response.error = `The my asset ${myAssetId} does not exist`;
            return response;
        }

        const buffer = await ctx.stub.getState(myAssetId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    /**
   *
   * myAssetExists
   *
   * Checks to see if a key exists in the world state.
   * @param myAssetId - the key of the asset to read
   * @returns boolean indicating if the asset exists or not.
   */
    async myAssetExists(ctx, myAssetId) {

        const buffer = await ctx.stub.getState(myAssetId);
        return (!!buffer && buffer.length > 0);

    }
}

module.exports = Maintenance;