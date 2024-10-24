import {
  createContext,
  type MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  AppNode,
  ContextMenuProps,
  IMenuType,
  OnContextMenu,
  OnNodeContextMenu
} from '../types/types';
import { ContextMenu } from '../components/prototypes/ContextMenuTemplate';
import SearchWidget from '../components/SearchWidget';
import { getContextMenuItems, getNodeMenuItems } from '../utils/menu';

interface IContextMenu {
  onNodeContextMenu: OnNodeContextMenu;
  onContextMenu: OnContextMenu;
  menuRef: RefObject<HTMLDivElement>;
  onPaneClick: () => void;
}

const ContextMenuContext = createContext<IContextMenu | null>(null);

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('ContextMenu must be used within a ContextMenuProvider');
  }

  return context;
}

export function ContextMenuProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [menuProps, setMenuProps] = useState<ContextMenuProps | null>(null);
  const [nodeId, setNodeId] = useState<string | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const [currentOpenedMenuIndex, setCurrentOpenedMenuIndex] = useState(0);
  const [menus, setMenus] = useState<ContextMenuProps[]>([]);
  const [currentSubmenu, setCurrentSubmenu] = useState<ContextMenuProps | null>(null);

  // state to manage menu dialog
  const [showSearchWidget, setShowSearchWidget] = useState(false);
  const [searchWidgetProps, setSearchWidgetProps] = useState<any>({});
  const searchWidgetRef = useRef<HTMLDivElement>(null);
  const [searchWidgetTimeOutID, setSearchWidgetTimeOutID] = useState<NodeJS.Timeout | null>(null);

  // function for handling double click
  const handleDoubleClick = (event?: MouseEvent) => {
    const widget = searchWidgetRef.current?.getBoundingClientRect();
    if (!widget) return;

    if (event) {
      setSearchWidgetProps({
        top: event.clientY,
        left: event.clientX
      });
    }
    setShowSearchWidget(true);
  };

  // function for mouse over
  const handleMouseLeave = () => {
    const timeOutID = setTimeout(() => {
      setShowSearchWidget(false);
    }, 1000);
    setSearchWidgetTimeOutID(timeOutID);
  };

  const handleMouseIn = () => {
    if (searchWidgetTimeOutID) {
      clearTimeout(searchWidgetTimeOutID);
    }
    setShowSearchWidget(true);
  };

  useEffect(() => {
    menuRef?.current?.addEventListener('dblclick', (event) => {
      handleDoubleClick(event);
      return;
    });
    return () => {
      menuRef?.current?.removeEventListener('dblclick', () => {
        handleDoubleClick();
      });
    };
  }, []);

  const onContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent | Event, data?: (IMenuType | null)[], title?: string) => {
      event.preventDefault();

      if (!data) {
        data = getContextMenuItems(onPaneClick);
      }

      // @ts-expect-error
      const menuProps = getMenuData(event, data, title);
      if (!menuProps) return;

      setMenuProps(() => menuProps);
    },
    [setMenuProps]
  );

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: AppNode) => {
      event.preventDefault();
      event.stopPropagation();

      const menuData = getMenuData(event, getNodeMenuItems(node, onPaneClick));
      if (!menuData) return;

      setMenuProps(menuData);
      setNodeId(node.id);
    },
    [setMenuProps, setNodeId]
  );

  const getMenuData = (event: ReactMouseEvent, items?: (IMenuType | null)[], title?: string) => {
    const pane = menuRef.current?.getBoundingClientRect();
    if (!pane) return;

    return {
      title,
      top: event.clientY < pane.height - 200 ? event.clientY : undefined,
      left: event.clientX < pane.width - 200 ? event.clientX : undefined,
      right: event.clientX >= pane.width - 200 ? pane.width - event.clientX : undefined,
      bottom: event.clientY >= pane.height - 200 ? pane.height - event.clientY : undefined,
      items: items
    } as ContextMenuProps;
  };

  // Close the context menu if it's open whenever the window is clicked.
  const onPaneClick = useCallback(() => {
    setMenuProps(null);
    setCurrentOpenedMenuIndex(0);
    setMenus([]);
    setCurrentSubmenu(null);
    setShowSearchWidget(false);
  }, [setMenuProps, setCurrentOpenedMenuIndex, setMenus, setCurrentSubmenu, setShowSearchWidget]);

  const reset = () => {
    setMenuProps(null);
    setNodeId(undefined);
  };

  const onSubContextMenu = (
    event: ReactMouseEvent,
    parentMenu: ContextMenuProps,
    parentMenuRef: RefObject<HTMLDivElement>,
    parentMenuIndex: number,
    items: IMenuType[] = []
  ) => {
    event.preventDefault();
    const submenuData = getMenuData(event, items);
    if (!submenuData) return;

    if (currentOpenedMenuIndex > parentMenuIndex) {
      setMenus((menus) => {
        return menus.slice(0, parentMenuIndex);
      });
    } else {
      if (parentMenuIndex > 0) {
        setMenus((menus) => {
          return [...menus, parentMenu];
        });
      }
    }

    const rect = parentMenuRef.current?.getBoundingClientRect();
    setCurrentSubmenu({
      ...submenuData,
      left: rect ? rect.left + rect.width : undefined,
      top: rect ? rect.top : undefined
    });
    setCurrentOpenedMenuIndex(parentMenuIndex);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        onContextMenu,
        onNodeContextMenu,
        onPaneClick,
        menuRef
      }}
    >
      {children}

      <SearchWidget
        handleMouseLeave={handleMouseLeave}
        handleMouseIn={handleMouseIn}
        show={showSearchWidget}
        widgetRef={searchWidgetRef}
        props={searchWidgetProps}
      />

      {menuProps && (
        <ContextMenu
          id={nodeId}
          reset={reset}
          menuIndex={0}
          {...menuProps}
          onSubmenuClick={onSubContextMenu}
        />
      )}

      {menus.map((menu, i) => (
        <ContextMenu
          key={i}
          {...menu}
          reset={reset}
          menuIndex={i + 1}
          onSubmenuClick={onSubContextMenu}
        />
      ))}

      {currentSubmenu && (
        <ContextMenu
          menuIndex={menus.length + 1}
          id={nodeId}
          reset={reset}
          {...currentSubmenu}
          onSubmenuClick={onSubContextMenu}
        />
      )}
    </ContextMenuContext.Provider>
  );
}