// 页面权限判断
import React from 'react';
import { useAccess, Access } from 'umi';

export default function NoAccessPage(props) {
    const { foo } = props;
    const access = useAccess(); // access 的成员: canReadFoo, canUpdateFoo, canDeleteFoo
 
    if (access.canReadFoo) {
    // 如果可以读取 Foo，则...
    }
 
    return (
        <div>
            <Access
                accessible={access.canReadFoo}
                fallback={<div>Can not read foo content.</div>}
            >
                {props.children}
            </Access>
        </div>
    );
};