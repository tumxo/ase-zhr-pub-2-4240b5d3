import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Building2, CalendarPlus, CalendarCheck, CalendarDays, Activity, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getBenutzer, removeBenutzer, initialen } from "@/lib/benutzer"

const NAV_ITEMS = [
  { title: "Buchen", url: "/buchen", icon: CalendarPlus },
  { title: "Meine Buchungen", url: "/buchungen", icon: CalendarCheck },
  { title: "Kalender", url: "/kalender", icon: CalendarDays },
  { title: "Status", url: "/status", icon: Activity },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const benutzer = getBenutzer() ?? ""

  function abmelden() {
    removeBenutzer()
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Calvin</div>
            <div className="text-xs text-muted-foreground">Raumbuchung</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<NavLink to={item.url} />}
                      isActive={isActive}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-8">
            <AvatarFallback>{initialen(benutzer)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">{benutzer}</div>
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={abmelden} title="Abmelden">
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
