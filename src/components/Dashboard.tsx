'use client';
import { useState } from "react";
import LoginApproval from "@/components/dashboard/LoginApproval";
import CreateTest from "@/components/dashboard/CreateTest";
import ManageTest from "@/components/dashboard/ManageTest";
import ManageUser from "@/components/dashboard/ManageUser";
import StudentTestResult from "@/components/dashboard/StudentTestResult";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<string>('Phê duyệt đăng nhập');
    const [activeComponent, setActiveComponent] = useState<string>('LoginApproval');
    const tabs = [
        {
            label: 'Phê duyệt đăng nhập',
            component: 'LoginApproval'
        },
        {
            label: 'Tạo mới Test',
            component: 'CreateTest'
        },
        {
            label: 'Quản lí Test',
            component: 'ManageTest'
        },
        {
            label: 'Quản lí User',
            component: 'ManageUser'
        },
        {
            label: 'Kết quả làm bài',
            component: 'StudentTestResult'
        },
    ];
    const renderContent = () => {
        switch (activeComponent) {
            case 'LoginApproval': return <LoginApproval />;
            case 'CreateTest': return <CreateTest />;
            case 'ManageTest': return <ManageTest />;
            case 'ManageUser': return <ManageUser />;
            case 'StudentTestResult': return <StudentTestResult />;
        }
    }
    const handleClick = (tab: {
        label: string,
        component: string
    }) => {
        setActiveTab(tab.label);
        setActiveComponent(tab.component);
    }
    return (
        <div className="p-2 lg:p-6 w-full min-h-[calc(100vh-281px)]">
            <div className="rounded-lg w-full h-full flex flex-col lg:flex-row gap-2 lg:gap-4">
                <div className="w-full lg:w-3/12 bg-white rounded-lg">
                    <div className="p-2 lg:p-4 flex flex-col gap-3 lg:gap-4">
                        <h1 className="text-xl lg:text-2xl font-bold text-center">DASHBOARD</h1>
                        <div className="flex flex-col items-center justify-center gap-1 text-xs lg:text-sm font-semibold w-[95%] lg:w-[90%] mx-auto">
                            {tabs.map(tab => {
                                return (
                                    <div key={tab.label} className="w-full">
                                        <button 
                                        onClick={() => handleClick(tab)}
                                        type="button" 
                                        className={`bg-amber-200 p-2 lg:p-3 w-full rounded-lg transition duration-300 hover:scale-105 hover:cursor-pointer hover:text-white hover:bg-amber-500 ${activeTab === tab.label ? 'bg-amber-500 text-white' : ''}`}>{tab.label}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-9/12 bg-white rounded-lg overflow-hidden">
                    <div className="h-full overflow-auto">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

